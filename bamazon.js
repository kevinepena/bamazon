var mysql = require("mysql");
var inquirer = require("inquirer");
const Table = require('cli-table');
const chalk = require('chalk');
const log = console.log;
const table = new Table();

// create the connection information for the sql database
var connection = mysql.createConnection({
    host: "localhost",

    // Your port; if not 3306
    port: 8889,

    // Your username
    user: "root",

    // Your password
    password: "root",
    database: "bamazon"
});




// connect to the mysql server and sql database
connection.connect(function (err) {

    connection.query("SELECT * FROM products", function (err, results) {

        table.push(["Product ID", "Product", "Price"]);
        for (var i = 0; i < results.length; i++) {
            table.push([results[i].id, results[i].productName, ("$" + (results[i].price))]);
        }
    });
    if (err) throw err;
    // run the start function after the connection is made to prompt the user
    start();
});

// function which prompts the user for what action they should take
function start() {



    // query the database for all items being sold
    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;

        console.log(table.toString());
        // once you have the items, prompt the user for which they'd like to buy
        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "input",
                    message: "Which item would you like to buy?"
                },
                {
                    name: "quantity",
                    type: "input",
                    message: "How many would you like to buy?"
                }
            ])
            .then(function (answer) {
                // get the information of the chosen item
                var chosenItem;
                // console.log(results[i]);
                for (var i = 0; i < results.length; i++) {

                    if (parseInt(answer.choice) === parseInt(results[i].id)) {
                        chosenItem = results[i];


                    }
                }

                var newnum = chosenItem.stockQuantity - answer.quantity;
                // determine if bid was high enough
                if (newnum >= 0) {

                    // bid was high enough, so update db, let the user know, and start over
                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                stockQuantity: newnum
                            },
                            {
                                id: chosenItem.id
                            }
                        ],
                        function (error) {
                            if (error) throw err;
                            console.log("Total : " + ((chosenItem.price) * answer.quantity));
                            start();
                        }
                    );
                }
                else {
                    // bid wasn't high enough, so apologize and start over
                    console.log("Insufficient quantity!");
                    start();
                }
            });
    });
}

// function to handle posting new items up for auction
function postAuction() {
    // prompt for info about the item being put up for auction
    inquirer
        .prompt([
            {
                name: "item",
                type: "input",
                message: "What is the item you would like to submit?"
            },
            {
                name: "department",
                type: "input",
                message: "What department would you like to place your auction in?"
            },
            {
                name: "price",
                type: "input",
                message: "What would you like your starting bid to be?",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            }
        ])
        .then(function (answer) {
            // when finished prompting, insert a new item into the db with that info
            connection.query(
                "INSERT INTO products SET ?",
                {
                    productName: answer.item,
                    department: answer.department,
                    price: answer.price,
                    stockQuantity: answer.price
                },
                function (err) {
                    if (err) throw err;
                    console.log("Your item was created successfully!");
                    // re-prompt the user for if they want to bid or post
                    start();
                }
            );
        });
}

function bidAuction() {
    // query the database for all items being auctioned
    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;
        // once you have the items, prompt the user for which they'd like to bid on
        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "rawlist",
                    choices: function () {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].productName);
                        }
                        return choiceArray;
                    },
                    message: "What auction would you like to place a bid in?"
                },
                {
                    name: "bid",
                    type: "input",
                    message: "How much would you like to bid?"
                }
            ])
            .then(function (answer) {
                // get the information of the chosen item
                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].productName === answer.choice) {
                        chosenItem = results[i];
                    }
                }

                // determine if bid was high enough
                if (chosenItem.stockQuantity < parseInt(answer.bid)) {
                    // bid was high enough, so update db, let the user know, and start over
                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                stockQuantity: answer.bid
                            },
                            {
                                id: chosenItem.id
                            }
                        ],
                        function (error) {
                            if (error) throw err;
                            console.log("Bid placed successfully!");
                            start();
                        }
                    );
                }
                else {
                    // bid wasn't high enough, so apologize and start over
                    console.log("Your bid was too low. Try again...");
                    start();
                }
            });
    });
}
