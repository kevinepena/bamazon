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
