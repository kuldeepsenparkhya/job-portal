const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt");
const { User } = require('../model');
const { handleError, createUUID, sendMailer } = require('../utils/helper');
const { JWT_EXPIRESIN, JWT_SECREATE, FRONTEND_URL } = require('../config/config');
const { loginUser, updateUserPassword, resetUserPassword } = require('./validator/userJoiSchema');


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body
        const { error } = loginUser.validate(req.body, { abortEarly: false })

        if (error) {
            handleError(error, 400, res)
            return
        }

        const user = await User.findOne({ email })
        if (!user || !(await user.matchPassword(password))) {
            handleError('Invalid login credentials', 400, res);
            return;
        } else {


            const token = jwt.sign({
                _id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            }, JWT_SECREATE, { expiresIn: JWT_EXPIRESIN })

            res.status(200).send({
                token: token,
                role: user.role,
                message: 'LoggedIn Successfully',
                error: false
            })
        }

    }
    catch (error) {
        handleError(error.message, 400, res)
    }
}

// // Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body
        const { error } = resetUserPassword.validate(req.body, { abortEarly: false })

        if (error) {
            handleError(error, 400, res)
            return
        }

        const user = await User.findOne({ email: email.toLowerCase() })

        if (!user) {
            handleError('Invalid email address', 400, res)
            return
        }

        if (user) {
            const token = createUUID()
            await User.updateOne({ _id: user._id }, { token: token }, { new: true })
                .then(data => {
                    const subject = 'Your forgot password link'
                    const message = `<div style="margin:auto width:70%">
                                        <div style="font-family: Helvetica,Arial,sans-serifmin-width:1000pxoverflow:autoline-height:2">
                                        <div style="margin:50px autowidth:60%padding:20px 0">
                                        <p style="font-size:25px">Hello,</p>
                                        <p>Use the code below to recover access to your College account.</p>
                                                <div style="border-bottom:1px solid #eee">
                                                <a href=${FRONTEND_URL}/reset-password?token=${token} style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Click the link and reset your password</a>
                                              </div>
                                          
                                        <p>The recovery code is only valid for 24 hours after it’s generated. If your code has already expired, you can restart the recovery process and generate a new code.
                                        If you haven't initiated an account recovery or password reset in the last 24 hours, ignore this message.</p>
                                        <p style="font-size:0.9em">Best Regards,<br />College</p>
                                        </div>
                                        </div>
                                        </div>`

                    sendMailer(`${email}`, subject, message, res)

                    return res.send({ message: `We have sent reset password email link`, error: false })

                })
                .catch(err => {
                    handleError(err.message, 400, res)
                })
        }
    } catch (error) {
        handleError(error.message, 400, res)
    }
};

// Forgot password verify
exports.forgotPasswordVerify = async (req, res) => {
    try {
        const { newPassword, confirmPassword, token } = req.body

        const { error } = updateUserPassword.validate(req.body, { abortEarly: false })
        if (error) {
            handleError(error, 400, res)
            return
        }

        const user = await User.findOne({ token: token })

        if (!user) {
            return res.status(409).send({ message: 'This link has already been used', error: true })
        }

        if (newPassword === confirmPassword) {
            const updatePassword = await bcrypt.hash(newPassword, 10);
            await User.updateOne({ token: token, _id: user._id }, { token: null, password: updatePassword }, { new: true })
                .then(data => {
                    return res.send({ message: 'You have successfully reset your password', error: false })
                })
                .catch(err => {
                    handleError(err.message, 400, res);
                    return
                })
        }
        else
            return handleError('Password and confirm password should be same.', 400, res);

    } catch (error) {
        handleError(error.message, 400, res);
    }



}

// Me
exports.me = async (req, res) => {
    const user = await User.findOne({ _id: req.user._id })
    user === null ? handleError('Unauthorized user', 400, res) : handleResponse(res, user._doc, 200)
}