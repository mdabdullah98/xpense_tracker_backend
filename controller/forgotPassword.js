require("dotenv").config();

const bcrypt = require("bcrypt");

const SibApiV3Sdk = require("sib-api-v3-sdk");

const uuid = require("uuid");

//creating instance for the transacEmail using  sedinblue library
const client = SibApiV3Sdk.ApiClient.instance;

const apiKey = client.authentications["api-key"];

apiKey.apiKey = process.env.SMPT_API_KEY;

//seqelize ForgotPassword models
const User = require("../models/user");

const ForgotPassword = require("../models/forgotPassword");

const forgotPasswordRouter = require("../routes/forgotPassword");

exports.ForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const transacEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

    //find the user innuser table to very the user exist
    const user = await User.findOne({ where: { email } });

    if (user) {
      const id = uuid.v4();

      //creating ForgotPassword table where column id and isActive
      ForgotPassword.create({
        id,
        isActive: true,
        expiresBy: new Date(Date.now()).toLocaleString(undefined, {
          timeZone: "Asia/Kolkata",
        }),
        userId: user.id,
      }).catch((err) => {
        throw new Error(err);
      });

      //sending sendinblue mail
      transacEmailApi
        .sendTransacEmail({
          sender: {
            email: "expenseTracker@expense.com",
            name: "expense_tracker",
          },
          to: [
            {
              email: email,
            },
          ],
          subject: "reset your password ",
          textContent: "test email for password reset",
          htmlContent: `
        <div>
        <h3>recover your password </h3>
        <form
          action="http://13.234.105.121:4001/user/password/reset_password/${id}"
          method="GET"
        >
          <button style="border:none;outline:none;background:lightcyan;padding:.5rem 2rem;border-radius:.3rem ; cursor:pointer;">
            <input
              type="submit"
              style="background:lightcyan; border:none;outline:none"   
              value="Reset Password"
            >
          </button>
        </form>
      </div>
    `,
        })
        .catch((err) => {
          if (err) throw new Error(err);
        });

      res.status(200).json({ success: true });
    } else {
      res.status(404).json({ success: false, message: "email does not exist" });
    }
  } catch (err) {
    res.status(400).json({ err: err, message: "something went wrong !" });
  }
};

//here we checking the the link of reset password we sent to user is used or not if its used then we alert that it already been used please generate new one
exports.authenticateLink = async (req, res, next) => {
  const { id } = req.params;

  try {
    const forgotPassword = await ForgotPassword.findOne({
      where: { id: id },
    });

    res.status(200).json({
      id: forgotPassword.id,
      isActive: forgotPassword.isActive,
    });
  } catch (err) {
    res.json(err);
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const forgotPassword = await ForgotPassword.findOne({
      where: { id: id },
    });

    if (forgotPassword.isActive) {
      const user = await User.findOne({ where: { id: forgotPassword.userId } });

      //udpating isActive status in fotgotPassword table
      await forgotPassword.update({
        isActive: false,
      });
      await forgotPassword.save();

      //updating user paswword using bycrypt
      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, function (err, hash) {
        if (err) throw new Error(err);
        user.update({
          psw: hash,
        });

        user.save();
      });

      return res
        .status(200)
        .json({ success: true, message: "new password updated successfuly" });
    }
  } catch (err) {
    res.status(500).json({ err: err });
  }
};

exports.showReserForm = (req, res) => {
  res.send("please reset your password");
};
