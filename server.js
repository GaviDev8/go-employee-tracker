const inquirer = require('inquirer');
const { Pool } = require('pg');
const { first } = require('rxjs');

const pool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'Wealthy8!',
    database: 'employee_tracker_db',
    port: 5432

},
console.log("Connected to the database")
);
pool.connect();

function quit() {
    console.log("Goodbye");
    process.exit();
}
// start
function viewEmployees() {
    sqlQuery = `SELECT employee.id,employee.first_name,
    employee.last_name,
    role.title,
    department.name AS department,
    role.salary,
    CONCAT(manager.first_name, '', manager.last_name) AS manager
    FROM employee JOIN role on employee.role_id = role.id
    JOIN department on role.department_id = department.id
    JOIN employee manager on employee.manager_id = manager.id;`;
    pool.query(sqlQuery, (err, res) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("\n");
        console.table(res.rows); 
        loadMainMenu();
    });
}

function viewEmployeesByDepartment() {
    let sqlQuery = 'SELECT * FROM department';
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }

        const departmentChoices = results.rows.map(department => ({
            name: department.name,
            value: department.id
        }));

        inquirer.prompt([{
            type: 'list',
            name: 'departmentId',
            message: 'Which department would you like to see employees belong to?',
            choices: departmentChoices
        }]).then(({ departmentId }) => {
            sqlQuery = `SELECT DISTINCT employee.id, employee.first_name, employee.last_name, role.title
            FROM employee 
            JOIN role ON employee.role_id = role.id
            JOIN department ON role.department_id = department.id 
            WHERE department.id = $1;`;
            pool.query(sqlQuery, [departmentId], (err, res) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log("\n");
                console.table(res.rows);
                loadMainMenu();
            });
        });
    });
}


function viewEmployeesByManager() {
    let sqlQuery = 'SELECT * FROM employee';
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.log(err);
        }
        const managerChoices = results.rows.map(({ id, first_name, last_name }) => ({
            name: `${first_name}, ${last_name}`,
            value: id,
        }));

        inquirer.prompt([{
            type: 'list',
            name: 'managerId',
            message: 'Which employee reporting structure would you like to view',
            choices: managerChoices,
        }])
        .then(({ managerId }) => {
            sqlQuery = `SELECT employee.manager_id, department.name, employee.first_name, employee.last_name 
            FROM employee
            JOIN role ON employee.role_id = role.id
            JOIN department ON role.department_id = department.id
            WHERE employee.manager_id = $1;`;
            pool.query(sqlQuery, [managerId], (err, results) => {
                if (err) {
                    console.error(err);
                    return;
                }
                if (results.rows.length === 0) {
                    console.log('Employee is not a manager.');
                } else {
                    console.log("\n");
                    console.table(results.rows);
                }
                loadMainMenu();
            });
        });
    });
}

function addEmployee() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'first_name',
            message: 'Enter first name:'
        },
        {
            type: 'input',
            name: 'last_name',
            message: 'Enter last name:'
        },
    ]).then(({ first_name, last_name }) => {
        pool.query("SELECT * FROM role", (err, results) => {
            if (err) {
                console.error('Error fetching roles:', err);
                return;
            }
            const roleChoices = results.rows.map(({ id, title }) => ({
                name: title,
                value: id,
            }));
            inquirer.prompt([
                {
                    type: 'list',
                    name: 'roleId',
                    message: "What is employee's role?",
                    choices: roleChoices
                }
            ]).then(({ roleId }) => {
                pool.query("SELECT * FROM employee", (err, results) => {
                    if (err) {
                        console.error('Error fetching employees:', err);
                        return;
                    }
                    let managerChoices = results.rows.map(({ id, first_name, last_name }) => ({
                        name: `${first_name} ${last_name}`,
                        value: id,
                    }));
                    inquirer.prompt([
                        {
                            type: 'list',
                            name: 'managerId',
                            message: "Who is the employee's manager?",
                            choices: managerChoices
                        }
                    ]).then(({ managerId }) => {
                        let employee = {
                            manager_id: managerId,
                            role_id: roleId,
                            first_name: first_name,
                            last_name: last_name
                        }

                        let sqlQuery = `INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)`;
                        pool.query(sqlQuery, [employee.first_name, employee.last_name, employee.role_id, employee.manager_id], (err, result) => {
                            if (err) {
                                console.error('Error adding employee:', err);
                                return;
                            }
                            console.log(`Employee added: ${employee.first_name} ${employee.last_name}`);
                            loadMainMenu();
                        });
                    });
                });
            });
        });
    });
}

function removeEmployee() {
    let sqlQuery = `SELECT * FROM employee`;
    pool.query(sqlQuery, (err, results) => {
        if (err) {
            console.error(err);
            return;
        }
        const employeeChoices = results.rows.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id,
        }));
        inquirer.prompt([
            {
                type: 'list',
                name: 'employeeId',
                message: 'Select the employee to remove:',
                choices: employeeChoices
            }
        ]).then(({ employeeId }) => {
            const deleteQuery = 'DELETE FROM employee WHERE id = $1';
            pool.query(deleteQuery, [employeeId], (err, result) => {
                if (err) {
                    console.error('Error removing employee:', err);
                    return;
                }
                console.log('Employee removed successfully.');
                loadMainMenu();
            });
        });
    });
}

function updateEmployeeRole() {
    pool.query("SELECT * FROM employee", (err, roleResults) => {
        if (err) {
            console.error('Error fetching roles:', err);
            return;
        }
        
        const employeeChoices = roleResults.rows.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));
        
        inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Which employee would you like to update?",
                choices: employeeChoices
            }
        ]).then(({ employeeId }) => {
            const roleChoices = roleResults.rows.map(({ id, title }) => ({
                name: title,
                value: id
            }));

            inquirer.prompt([
                {
                    type: "list",
                    name: "roleId",
                    message: "Select the new role for the employee:",
                    choices: roleChoices
                }
            ]).then(({ roleId }) => {
                let sqlQuery = `UPDATE employee SET role_id = $1 WHERE id = $2;`;
                pool.query(sqlQuery, [roleId, employeeId], (err, updateResult) => {
                    if (err) {
                        console.error('Error updating employee role:', err);
                        return;
                    }
                    console.log("\nEmployee role updated");
                    loadMainMenu();
                });
            });
        });
    });
}

function updateEmployeeManager() {
    pool.query("SELECT * FROM employee", (err, results) => {
        if (err) {
            console.error('Error fetching employees:', err);
            return;
        }
        
        const employeeChoices = results.rows.map(({ id, first_name, last_name }) => ({
            name: `${first_name} ${last_name}`,
            value: id
        }));
        
        inquirer.prompt([
            {
                type: "list",
                name: "employeeId",
                message: "Which employee's manager would you like to change?",
                choices: employeeChoices
            }
        ]).then(({ employeeId }) => {
            pool.query("SELECT id, first_name, last_name FROM employee WHERE id != $1", [employeeId], (err, managerResults) => {
                if (err) {
                    console.error('Error fetching managers:', err);
                    return;
                }
                
                const managerChoices = managerResults.rows.map(({ id, first_name, last_name }) => ({
                    name: `${first_name} ${last_name}`,
                    value: id
                }));
                
                inquirer.prompt([
                    {
                        type: 'list',
                        name: 'managerId',
                        message: 'Who is the employee\'s new manager?',
                        choices: managerChoices
                    }
                ]).then(({ managerId }) => {
                    let sqlQuery = `UPDATE employee SET manager_id = $1 WHERE id = $2`;
                    pool.query(sqlQuery, [managerId, employeeId], (err, updateResults) => {
                        if (err) {
                            console.error('Error updating employee manager:', err);
                            return;
                        }
                        console.log("\nEmployee manager updated");
                        loadMainMenu();
                    });
                });
            });
        });
    });
}

function addDepartment() {
    inquirer.prompt([
        {
            type: 'input',
            name: 'departmentName',
            message: 'Enter the name of the new department:'
        }
    ]).then(({ departmentName }) => {
        pool.query('INSERT INTO department (name) VALUES ($1)', [departmentName], (err, results) => {
            if (err) {
                console.error('Error adding department:', err);
                return;
            }
            console.log(`\nDepartment "${departmentName}" added successfully.`);
            loadMainMenu();
        });
    });
}

function removeDepartment() {
    pool.query('SELECT * FROM department', (err, results) => {
        if (err) {
            console.error('Error fetching departments:', err);
            return;
        }
        
        const departmentChoices = results.rows.map(({ id, name }) => ({
            name: name,
            value: id
        }));
        
        inquirer.prompt([
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select the department to remove:',
                choices: departmentChoices
            },
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to remove this department?',
                default: false
            }
        ]).then(({ departmentId, confirm }) => {
            if (confirm) {
                pool.query('DELETE FROM department WHERE id = $1', [departmentId], (err, results) => {
                    if (err) {
                        console.error('Error removing department:', err);
                        return;
                    }
                    console.log('\nDepartment removed successfully.');
                    loadMainMenu();
                });
            } else {
                console.log('\nDepartment removal cancelled.');
                loadMainMenu();
            }
        });
    });
}

function viewRole() {
    pool.query(`
        SELECT role.title, role.id, department.name AS department_name, role.salary 
        FROM role 
        LEFT JOIN department ON role.department_id = department.id
    `, (err, result) => {
        if (err) {
            console.error('Error fetching roles:', err);
        } else {
            console.log('LIST OF ROLES......');
            console.table(result.rows);
            loadMainMenu();
        }
    });
}

function addRole() {
    pool.query('SELECT * FROM department', (err, results) => {
        if (err) {
            console.error('Error fetching departments:', err);
            return;
        }
        
        const departmentChoices = results.rows.map(({ id, name }) => ({
            name: name,
            value: id
        }));
        
        inquirer.prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter the title of the new role:'
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the salary for the new role:'
            },
            {
                type: 'list',
                name: 'departmentId',
                message: 'Select the department for the new role:',
                choices: departmentChoices
            }
        ]).then(({ title, salary, departmentId }) => {
            pool.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', [title, salary, departmentId], (err, results) => {
                if (err) {
                    console.error('Error adding role:', err);
                    return;
                }
                console.log(`\nRole "${title}" added successfully.`);
                loadMainMenu();
            });
        });
    });
}

function removeRole() {
    pool.query('SELECT * FROM role', (err, results) => {
        if (err) {
            console.error('Error fetching roles:', err);
            return;
        }
        
        const roleChoices = results.rows.map(({ id, title }) => ({
            name: title,
            value: id
        }));
        
        inquirer.prompt([
            {
                type: 'list',
                name: 'roleId',
                message: 'Select the role to remove:',
                choices: roleChoices
            },
            {
                type: 'confirm',
                name: 'confirm',
                message: 'Are you sure you want to remove this role?',
                default: false
            }
        ]).then(({ roleId, confirm }) => {
            if (confirm) {
                pool.query('DELETE FROM role WHERE id = $1', [roleId], (err, results) => {
                    if (err) {
                        console.error('Error removing role:', err);
                        return;
                    }
                    console.log('\nRole removed successfully.');
                    loadMainMenu();
                });
            } else {
                console.log('\nRole removal cancelled.');
                loadMainMenu();
            }
        });
    });
}

// main menu function/prompt
function loadMainMenu() {
    inquirer.prompt([{
        type: 'list',
        name: 'choice',
        message: 'what would you like to do?',
        choices: [
            {
                name: "View all employees",
                value: "VIEW_EMPLOYEES"
            },{
                name: "View all employees by department",
                value: "VIEW_EMPLOYEES_BY_DEPARTMENT"
            },{
                name: "View all employees by manager",
                value: "VIEW_EMPLOYEES_BY_MANAGER",
            },{
                name: "Add employee",
                value: "ADD_EMPLOYEE",
            },{
                name: "Remove employee",
                value: "REMOVE_EMPLOYEE"
            },{
                name: "Update employee role",
                value: "UPDATE_EMPLOYEE_ROLE"
            },{
                name: "Update employees manager?",
                value: "UPDATE_EMPLOYEE_MANAGER"
            },{
                name: "Add department",
                value: "ADD_DEPARTMENT"
            },{
                name: "Remove department",
                value: "REMOVE_DEPARTMENT"
            },{
                name: "View role",
                value: "VIEW_ROLE"
            },{
                name: "Add role",
                value: "ADD_ROLE"
            },{
                name: "Remove role",
                value: "REMOVE_ROLE"
            },{
                name: "Quit",
                value: "QUIT"
            }
        ]
    }]).then((answers) => {
        let { choice } = answers;
        if(answers.choice === "VIEW_EMPLOYEES") {
          viewEmployees();
        } else if (choice === "VIEW_EMPLOYEES_BY_DEPARTMENT") {
            viewEmployeesByDepartment();
        }
        else if (choice === "VIEW_EMPLOYEES_BY_MANAGER") {
            viewEmployeesByManager();
        } 
        else if (choice === "ADD_EMPLOYEE") {
            addEmployee();
        } 
        else if (choice === "REMOVE_EMPLOYEE") {
            removeEmployee();
        } 
        else if (choice === "UPDATE_EMPLOYEE_ROLE") {
            updateEmployeeRole();
        } 
        else if (choice === "UPDATE_EMPLOYEE_MANAGER") {
            updateEmployeeManager();
        } 
        else if (choice === "ADD_DEPARTMENT") {
            addDepartment();
        }
        else if (choice === "REMOVE_DEPARTMENT") {
            removeDepartment();
        }
        else if (choice === "VIEW_ROLE") {
            viewRole();
        }
        else if (choice === "ADD_ROLE") {
            addRole();
        }
        else if (choice === "REMOVE_ROLE") {
            removeRole();
        }
        else {
            quit();
        }
        console.log(answers);
    })
}

function init(){
    console.log("Welcome to the Employee Management System");
    loadMainMenu();
}

init();