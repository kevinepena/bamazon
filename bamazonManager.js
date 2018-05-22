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



    if (err) throw err;
    // run the start function after the connection is made to prompt the user
    start();
});



// function which prompts the manager for what action they should take
function start() {

    // query the database for all items being sold
    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;




        // Prompt the manager what they would like to do
        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "list",
                    message: "Which item would you like to do?",
                    choices: ["View Products For Sale", "View Low Inventory", "Add to Inventory", "Add New Product"]
                },
            ])
            .then(function (answer) {
                // get the information of the chosen item
                switch (answer.choice) {
                    case "View Products For Sale":
                        listAll();
                        break;

                    case "View Low Inventory":
                        lowInventory();
                        break;

                    case "Add to Inventory":
                        addInventory();
                        break;

                    case "Add New Product":
                        addProduct();
                        break;
                }
            });
    });
}

function listAll() {

    connection.query("SELECT * FROM products", function (err, results) {

        table.push(["Product ID", "Product", "Price", "Quantity"]);
        for (var i = 0; i < results.length; i++) {
            table.push([results[i].id, results[i].productName, ("$" + (results[i].price)), results[i].stockQuantity]);
        }
        console.log(table.toString());
    });

    start();
}

// function to handle posting new items up for auction
function addProduct() {
    // prompt for info about the item being put up for auction
    inquirer
        .prompt([
            {
                name: "item",
                type: "input",
                message: "What is the item you would like to add?"
            },
            {
                name: "department",
                type: "input",
                message: "What department is this item in?"
            },
            {
                name: "price",
                type: "input",
                message: "What is the price?",
                validate: function (value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            },
            {
                name: "quantity",
                type: "input",
                message: "How many?",
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
                    stockQuantity: answer.quantity
                },
                function (err) {
                    if (err) throw err;
                    console.log("Your item was entered successfully!");
                    // re-prompt the user for if they want to bid or post
                    start();
                }
            );
        });
}

function addInventory() {
    // query the database for all items being auctioned
    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;
        // once you have the items, prompt the user for which they'd like to bid on
        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "list",
                    choices: function () {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].productName);
                        }
                        return choiceArray;
                    },
                    message: "What item would you like to add inventory for?"
                },
                {
                    name: "add",
                    type: "input",
                    message: "How many would you like to add?"
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

                // bid was high enough, so update db, let the user know, and start over
                connection.query(
                    "UPDATE products SET ? WHERE ?",
                    [
                        {
                            stockQuantity: (parseFloat(answer.add) + parseFloat(chosenItem.stockQuantity))
                        },
                        {
                            id: chosenItem.id
                        }
                    ],
                    function (error) {
                        if (error) throw err;
                        console.log("Inventory updated");
                        start();
                    }
                );
            });
    });
}

function lowInventory() {
    connection.query("SELECT * FROM products", function (err, results) {

        table.push(["Product ID", "Product", "Price", "Quantity"]);
        for (var i = 0; i < results.length; i++) {
            if (results[i].stockQuantity < 5)
            {
                table.push([results[i].id, results[i].productName, ("$" + (results[i].price)), results[i].stockQuantity]);
            }
        }
        console.log(table.toString());
    });

    start();
}