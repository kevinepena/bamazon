var mysql = require("mysql");
var inquirer = require("inquirer");
const Table = require('cli-table');
const chalk = require('chalk');
const log = console.log;
const table = new Table({
    chars: { 'top': '═' , 'top-mid': '╤' , 'top-left': '╔' , 'top-right': '╗'
    , 'bottom': '═' , 'bottom-mid': '╧' , 'bottom-left': '╚' , 'bottom-right': '╝'
    , 'left': '║' , 'left-mid': '╟' , 'mid': '─' , 'mid-mid': '┼'
    , 'right': '║' , 'right-mid': '╢' , 'middle': '│' }
}
);

// create the connection information for the sql database
var connection = mysql.createConnection({
    host: "localhost",

    // Your port
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

        table.push([chalk.inverse("Product ID"), chalk.inverse("Product"), chalk.inverse("Price")]);
        for (var i = 0; i < results.length; i++) {
            table.push([chalk.blue(results[i].id), results[i].productName, (chalk.green("$") + (results[i].price))]);
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
                    message: "Which item would you like to buy?",
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
                    message: "How many would you like to buy?"
                }
            ])
            .then(function (answer) {
                // get the information of the chosen item
                var chosenItem;
                for (var i = 0; i < results.length; i++) {

                    if (parseInt(answer.choice) === parseInt(results[i].id)) {
                        chosenItem = results[i];
                    }
                }

                if (chosenItem == null) {
                    console.log(chalk.red("----------------------"));
                    console.log(chalk.red("Item Not Found!"));
                    console.log(chalk.red("Select Another Item!"));
                    console.log(chalk.red("----------------------"));
                    start();
                } else {

                var newnum = chosenItem.stockQuantity - answer.quantity;
                // determine if there are enough in stock
                if (newnum >= 0) {

                    // there were enough in quantity, so update db, let the user know, and start over
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
                    // not enough in stock and start over
                    console.log(chalk.red("----------------------"));
                    console.log(chalk.red("Insufficient quantity!"));
                    console.log(chalk.red("----------------------"));
                    start();
                }
            }
            });
        
    });
}
