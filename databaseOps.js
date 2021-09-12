'use strict'

// database operations.
// Async operations can always fail, so these are all wrapped in try-catch blocks
// so that they will always return something
// that the calling function can use. 

module.exports = {
  // testDB: testDB,
  post_activity: post_activity,
  get_most_recent_planned_activity_in_range: get_most_recent_planned_activity_in_range,
  delete_past_activities_in_range: delete_past_activities_in_range,
  get_most_recent_entry: get_most_recent_entry,
  get_similar_activities_in_range: get_similar_activities_in_range,
  get_all: get_all,
  add_profile: add_profile,
  check_profile: check_profile,
  getAllProfiles: getAllProfiles,
  getNameWithId: getNameWithId,
  getAllActivities: getAllActivities,
  deleteAllProfiles: deleteAllProfiles,
  deleteAllActivities: deleteAllActivities,
  check_id: check_id
}

// using a Promises-wrapped version of sqlite3
const db = require('./sqlWrap');

// our activity verifier
const act = require('./activity');

// SQL commands for ActivityTable
const insertDB = "insert into ActivityTable (id,activity, date, amount) values (?,?,?,?)"
const getOneDB = "select * from ActivityTable where id = ? and activity = ? and date = ?";
const allDB = "select * from ActivityTable where id = ? and activity = ?";
const deletePrevPlannedDB = "DELETE FROM ActivityTable WHERE id = ? and amount < 0 and date BETWEEN ? and ?";
const getMostRecentPrevPlannedDB = "SELECT rowIdNum, activity, MAX(date), amount FROM ActivityTable WHERE id = ? and amount <= 0 and date BETWEEN ? and ?";
const getMostRecentDB = "SELECT MAX(rowIdNum), id, activity, date, amount FROM ActivityTable";
const getPastWeekByActivityDB = "SELECT * FROM ActivityTable WHERE id = ? and activity = ? and date BETWEEN ? and ? ORDER BY date ASC";

const addProfile = "insert into ProfileTable (id, fName) values (?,?)";

const checkProfile = "SELECT 1 FROM ProfileTable WHERE id = ? and fName = ?";

const checkId = "SELECT 1 FROM ProfileTable WHERE id = ?";

const getAll_Profiles = "SELECT * FROM ProfileTable where id > 1";

const deleteAll = "DELETE from ProfileTable where id > 1";
const deleteAlla = "DELETE from ActivityTable where id > 1";

const get_Id = "SELECT * from ProfileTable WHERE id = ?";

const getAll_activities = "SELECT * FROM ActivityTable WHERE id > 1";


function fixIdInput(id) { //doing this because when I was inputting, id got changed somehow at certain points
  let temp = id.toString();
  temp = temp.substring(0,11); //converting to smaller number so that input properly
  temp = parseInt(temp);
  return temp;
}

async function deleteAllProfiles() {
  try {
    await db.run(deleteAll);
  }
  catch (error) {
    console.log(error);
  }
}

async function deleteAllActivities() {
  try {
    await db.run(deleteAlla);
  }
  catch (error) {
    console.log(error);
  }
}

async function getNameWithId(id) {
  let temp = fixIdInput(id);
  let arr = await db.all(get_Id, [temp]); 
  console.log(`Getting profile with userid: ${temp}`);
  
  for(let i = 0; i < arr.length; i++ ){
    console.log(arr[i]);
  }
  let temp2 = arr[0].fName;
  console.log("Returning expected: " + temp2);
  return temp2;
}

async function getAllActivities() {
  let arr = await db.all(getAll_activities); 
  console.log("Activities database consists of: ")
  console.log(arr.length);
  for(let i = 0; i < arr.length; i++) {
    console.log(JSON.stringify(arr[i]));
  }
}

async function getAllProfiles() {
  try {

    let arr = await db.all(getAll_Profiles); 
    console.log("Profile database consists of: ")
    for(let i = 0; i < arr.length; i++) {
      console.log(JSON.stringify(arr[i]));
    }
  } catch (error) {
    console.log("error", error)
  }
}

async function check_profile(id, fName) {
  let temp = fixIdInput(id);
  try {
    let val = await db.get(checkProfile, [temp, fName]); //returns 1 if already in db
    // console.log(`CHECKING FOR PROFILE: ${val} with values ${id}, ${fName}`);
    return val;
  } catch (error) {
    console.log("error", error)
  }
}

async function check_id(id) {
  let temp = fixIdInput(id);
  try {
    let val = await db.get(checkId, [temp]); //returns 1 if already in db
    // console.log(`CHECKING FOR PROFILE: ${val} with values ${id});
    return val;
  } catch (error) {
    console.log("error", error)
  }
}

async function add_profile(id, fName) {
  try {
    console.log(`Received ${id}, ${fName}, adding now.`)
    let temp = fixIdInput(id);
    await db.run(addProfile, [temp, fName]);
  } catch (error) {
    console.log("error", error)
  }
}

/**
 * Insert activity into the database
 * @param {Activity} activity 
 * @param {string} activity.activity - type of activity
 * @param {number} activity.date - ms since 1970
 * @param {float} activity.scalar - measure of activity conducted
 */
async function post_activity(id, activity) {
  try {
    let activityObj = act.ActivityToList(activity)
    await db.run(insertDB, [id, activityObj[0], activityObj[1], activityObj[2]]);
  } catch (error) {
    console.log("error", error)
  }
}


/**
 * Get the most recently planned activity that falls within the min and max 
 * date range
 * @param {number} min - ms since 1970
 * @param {number} max - ms since 1970
 * @returns {Activity} activity 
 * @returns {string} activity.activity - type of activity
 * @returns {number} activity.date - ms since 1970
 * @returns {float} activity.scalar - measure of activity conducted
 */
async function get_most_recent_planned_activity_in_range(id, min, max) {
  try {
    let results = await db.get(getMostRecentPrevPlannedDB, [id, min, max]);
    return (results.rowIdNum != null) ? results : null;
  }
  catch (error) {
    console.log("error h", error);
    return null;
  }
}



/**
 * Get the most recently inserted activity in the database
 * @returns {Activity} activity 
 * @returns {string} activity.activity - type of activity
 * @returns {number} activity.date - ms since 1970
 * @returns {float} activity.scalar - measure of activity conducted
 */
async function get_most_recent_entry(id) {
  try {
    let result = await db.get(getMostRecentDB, [id]);
    return (result['MAX(rowIdNum)'] != null) ? result : null;
  }
  catch (error) {
    console.log(error);
    return null;
  }
}


/**
 * Get all activities that have the same activityType which fall within the 
 * min and max date range
 * @param {string} activityType - type of activity
 * @param {number} min - ms since 1970
 * @param {number} max - ms since 1970
 * @returns {Array.<Activity>} similar activities
 */
async function get_similar_activities_in_range(id, activityType, min, max) {
  try {
    let results = await db.all(getPastWeekByActivityDB, [id, activityType, min, max]);
    return results;
  }
  catch (error) {
    console.log(error);
    return [];
  }
}


/**
 * Delete all activities that have the same activityType which fall within the 
 * min and max date range
 * @param {number} min - ms since 1970
 * @param {number} max - ms since 1970
 */
async function delete_past_activities_in_range(id, min, max) {
  try {
    await db.run(deletePrevPlannedDB, [id, min, max]);
  }
  catch (error) {
    console.log(error);
  }
}

// UNORGANIZED HELPER FUNCTIONS


/**
 * Convert GMT date to UTC
 * @returns {Date} current date, but converts GMT date to UTC date
 */
function newUTCTime() {
  let gmtDate = new Date()
  return (new Date(gmtDate.toLocaleDateString())).getTime()
}

function randomNumber(min, max, round = true) { 
  let val =  Math.random() * (max - min) + min
  if (round) {
    return Math.round(val * 100) / 100
  } else {
    return Math.floor(val)
  }
}

// dumps whole table; useful for debugging
async function get_all() {
  try {
    let results = await db.all("select * from ActivityTable", []);
    return results;
  } 
  catch (error) {
    console.log(error);
    return [];
  }
}