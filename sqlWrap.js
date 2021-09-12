'use strict'

const sql = require('sqlite3');
const util = require('util');


// old-fashioned database creation code 

// creates a new database object, not a 
// new database. 
const db = new sql.Database("activities.db");


// check if database exists
let cmd = " SELECT name FROM sqlite_master WHERE type='table' AND name='ActivityTable' ";
let cmd2 = " SELECT name FROM sqlite_master WHERE type='table' AND name='ProfileTable' ";
db.get(cmd, function (err, val) {
  if (val == undefined) {
        console.log("No activity database file - creating one");
        createActivityTable();
  } else {
        console.log(val);
        console.log("Activity Database file found");
  }
});

db.get(cmd2, function (err, val2) {
  if (val2 == undefined) {
        console.log("No profile database file - creating one");
        createProfileTable();
  } else {
      console.log(val2);
      console.log("Profile Database file found");
  }
});

// called to create table if needed
function createActivityTable() {
  // explicitly declaring the rowIdNum protects rowids from changing if the 
  // table is compacted; not an issue here, but good practice
  const cmd = 'CREATE TABLE ActivityTable (rowIdNum INTEGER PRIMARY KEY, id INTEGER, activity TEXT, date INTEGER, amount FLOAT)';
  db.run(cmd, function(err, val) {
    if (err) {
      console.log("Database creation failure",err.message);
    } else {
      console.log("Created database");
    }
  });
}

// called to create table if needed
function createProfileTable() {
  // explicitly declaring the rowIdNum protects rowids from changing if the 
  // table is compacted; not an issue here, but good practice
  const cmd2 = 'CREATE TABLE ProfileTable (rowIdNum INTEGER PRIMARY KEY, id INTEGER, fName TEXT)';
  db.run(cmd2, function(err, val2) {
    if (err) {
      console.log("Database creation failure",err.message);
    } else {
      console.log("Created database");
    }
  });
}

// wrap all database commands in promises
db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);

// profile.run = util.promisify(profile.run);
// profile.get = util.promisify(profile.get);
// profile.all = util.promisify(profile.all);

// empty all data from db
db.deleteEverything = async function() {
  await activity.run("delete from ActivityTable");
  activity.run("vacuum");
}

db.deleteEverything = async function() {
  await profile.run("delete from ProfileTable");
  profile.run("vacuum");
}

// allow code in index.js to use the db object
module.exports = db;
// module.exports = profile;
