import passport from 'passport'
import {Strategy as GoogleStrategy} from 'passport-google-oauth20'
import User from '../models/User.mjs'

export default passport.use(
    new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URI,
        scope: ['profile', 'email'] // Cho phép truy cập các thông tin cơ bản trong Google và email user
    }, async (accessToken, refreshToken, profile, done) => {
        // khi bấm login (/auth/google) -> vào passport -> gọi lên gg chứ chưa chạy hàm phía dưới này
        // -> gg xử lí xong gọi callback về (/auth/google/redirect) -> vào passport kèm code nhận dc từ gg
        // -> gọi lên gg để check code -> trả về profile -> vào hàm này xử lí profile (check db....)
        // -> gọi done(null, user): gán user vào req -> qua controller auth để xử lí req (tạo jwt)
        try {
            const userEmail = profile.emails[0].value
            const googleId = profile.id;

            // TÌM người dùng hiện có bằng Google ID HOẶC Email
            let user = await User.findOne({ 
                $or: [{ googleId: googleId }, { email: userEmail }] 
            });

            if (user) {
                //[ĐĂNG NHẬP]
                // Nếu trước đó người dùng đăng nhập local, thực hiện liên kết với google để có thể
                //thực hiện đăng nhập cả trên google và local (password)
                if (!user.googleId) {
                    console.log(`Người dùng đã tồn tại: Liên kết tài khoản Google cho email ${userEmail}`);
                    user.googleId = googleId
                    await user.save();
                }
                return done(null, user)
            }
            //Nếu người dùng mới thì lưu vào DB [ĐĂNG KÝ]
            else {
                console.log(`Người dùng mới: Tạo bản ghi cho email ${userEmail}`)
                const newUser = new User ({
                    // Không cần pass
                    email: userEmail,
                    fullName: profile.displayName,
                    googleId: googleId,
                    loginMethod: 'google',
                    role: 'customer', 
                    isLocked: false,
                })
                await newUser.save()
                return done(null, newUser)
            }
        }
        catch(err) {
            console.error("Lỗi trong Google Strategy:", err);
            return done(err, null);
        }
    })
)
