const express = require("express");
const sequelize = require("./utils/databse");
const helmet = require("helmet");
const morgan = require("morgan");
const fs = require("fs");

// all model required so that it can sync properly theres new to that but as of now I am doing this way
const User = require("./models/user");
const Expense = require("./models/expense");
const Income = require("./models/income");
const Order = require("./models/order");
const ForgotPassword = require("./models/forgotPassword");

const userRouter = require("./routes/user");
const paymentRouter = require("./routes/payment");
const forgotPasswordRouter = require("./routes/forgotPassword");

const cors = require("cors");
const path = require("path");

const server = express();
const Port = process.env.Port || 4000;

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));
server.use(helmet());

//server routes middleware
server.use("/", userRouter);
server.use("/api/user", paymentRouter);
server.use("/user", forgotPasswordRouter);

//creating acces log
const accessLog = fs.createWriteStream(path.join(__dirname, "accesslog"), {
  flags: "a",
});
server.use(morgan("combined", { stream: accessLog }));

//sql realtion over here
//expense realtion with user where once user can post many expense as it is one-to-many relationship
User.hasMany(Expense, { onDelete: "CASCADE" });
Expense.belongsTo(User);

//income relation with user  where once user can post many income as it is one-to-many relationship
User.hasMany(Income, { onDelete: "CASCADE" });
Income.belongsTo(User);

//order realtion with user  where once user can post many order as it is one-to-many relationship
User.hasMany(Order, { onDelete: "CASCADE" });
Order.belongsTo(User);

//ForgotPassword realtion withe user as this will aslo be a one-to-many relationship
User.hasMany(ForgotPassword, { onDelete: "CASCADE" });
ForgotPassword.belongsTo(User);

sequelize
  .sync()
  .then((res) => {
    //creating conncetion with sequlize if no error then our server will start lisening
    server.listen(Port, () => {
      console.log(`server is running on port http://localhost:${Port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
