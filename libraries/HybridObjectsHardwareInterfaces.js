﻿/*
 *   Created by Carsten on 12/06/2015.
 *   Copyright (c) 2015 Carsten Strunk
 *
 *   This Source Code Form is subject to the terms of the Mozilla Public
 *   License, v. 2.0. If a copy of the MPL was not distributed with this
 *   file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Hybrid Objecst Hardware Interface API
 * 
 * This API is intended for users who want to create their own hardware interfaces.
 * To create a new hardware interface create a folder under hardwareInterfaces and create the file index.js.
 * You should take a look at /hardwareInterfaces/emptyExample/index.js to get started.
 */



var http = require('http');
var HybridObjectsUtilities = require(__dirname + '/HybridObjectsUtilities');
var _ = require('lodash');

//global variables, passed through from server.js
var objectExp;
var objectLookup;
var globalVariables;
var dirnameO;
var pluginModules;
var callback;
var ObjectValue;

//data structures to manage the IO points generated by the API user
function HardwareInterface() {
    this.hybridObjects = {};
}

function HybridObject(objName) {
    this.name = objName;
    this.ioPoints = {};
}

function IOPoint(ioName) {
    this.name = ioName;
}

var hardwareInterfaces = {};


/*
 ********** API FUNCTIONS *********
 */


/**
 * @desc This function writes the values passed from the hardware interface to the HybridObjects server.
 * @param {string} objName The name of the HybridObject
 * @param {string} ioName The name of the IO point
 * @param {} value The value to be passed on
 * @param {string} mode specifies the datatype of value, you can define it to be whatever you want. For example 'f' could mean value is a floating point variable.
**/
exports.writeIOToServer = function (objName, ioName, value, mode) {
    var objKey2 = HybridObjectsUtilities.readObject(objectLookup, objName); //get globally unique object id
    var valueKey = ioName + objKey2;

    if (objectExp.hasOwnProperty(objKey2)) {
        if (objectExp[objKey2].objectValues.hasOwnProperty(valueKey)) {
            objectExp[objKey2].objectValues[valueKey].value = value;
            objectExp[objKey2].objectValues[valueKey].mode = mode;
            //callback is objectEngine in server.js. Notify data has changed.
            callback(objKey2, valueKey, objectExp, pluginModules);
        }
    }
};

/**
 * @desc clearIO() removes IO points which are no longer needed. It should be called in your hardware interface after all addIO() calls have finished.
 * @param {string} type The name of your hardware interface (i.e. what you put in the type parameter of addIO())
**/
exports.clearIO = function (type) {
    if(hardwareInterfaces.hasOwnProperty(type)) { //check if IO points of the specified type have been added
        for (var objName in hardwareInterfaces[type].hybridObjects) {
            objectID = HybridObjectsUtilities.getObjectIdFromTarget(objName, dirnameO);

            if (!_.isUndefined(objectID) && !_.isNull(objectID) && objectID.length > 13) {
                for (var key in objectExp[objectID].objectValues) {
                    if (!hardwareInterfaces[type].hybridObjects[objName].ioPoints.hasOwnProperty(objectExp[objectID].objectValues[key].name)) {
                        delete objectExp[objectID].objectValues[key];
                    }
                }

            }

        }
    }
    if (globalVariables.debug) console.log("it's all cleared");
};


/**
 * @desc addIO() a new IO point to the specified HybridObject
 * @param {string} objName The name of the HybridObject
 * @param {string} ioName The name of the ioName
 * @param {string} plugin The name of the data conversion plugin. If you don't have your own put in "default".
 * @param {string} type The name of your hardware interface
**/
exports.addIO = function (objName, ioName, plugin, type) {
    HybridObjectsUtilities.createFolder(objName, dirnameO, globalVariables.debug);

    var objectID = HybridObjectsUtilities.getObjectIdFromTarget(objName, dirnameO);
    if (globalVariables.debug) console.log("AddIO objectID: " + objectID + "   " + type);

    objID = ioName + objectID;

    if (!_.isUndefined(objectID) && !_.isNull(objectID)) {

        if (objectID.length > 13) {

            if (globalVariables.debug) console.log("I will save: " + objName + " and: " + ioName);

            if (objectExp.hasOwnProperty(objectID)) {
                objectExp[objectID].developer = globalVariables.developer;
                objectExp[objectID].name = objName;

                if (!objectExp[objectID].objectValues.hasOwnProperty(objID)) {
                    var thisObject = objectExp[objectID].objectValues[objID] = new ObjectValue();
                    thisObject.x = HybridObjectsUtilities.randomIntInc(0, 200) - 100;
                    thisObject.y = HybridObjectsUtilities.randomIntInc(0, 200) - 100;
                    thisObject.frameSizeX = 47;
                    thisObject.frameSizeY = 47;
                }


                
                var thisObj = objectExp[objectID].objectValues[objID];
                thisObj.name = ioName;
                thisObj.plugin = plugin;
                thisObj.type = type;

                //Add entries to the management data structures
                if(!hardwareInterfaces.hasOwnProperty(type)){
                    hardwareInterfaces[type] = new HardwareInterface();
                }
                
                if(!hardwareInterfaces[type].hybridObjects.hasOwnProperty(objName)){
                    hardwareInterfaces[type].hybridObjects[objName] = new HybridObject(objName);
                }
               
                if(!hardwareInterfaces[type].hybridObjects[objName].ioPoints.hasOwnProperty(ioName)){
                    hardwareInterfaces[type].hybridObjects[objName].ioPoints[ioName] = new IOPoint(ioName);
                }
            }
        }
    }
    objectID = undefined;
};

/**
 * @desc developerOn() Enables the developer mode for all HybridObjects and enables the developer web interface
**/
exports.developerOn = function () {
    globalVariables.developer = true;
    for (var objectID in objectExp) {
        objectExp[objectID].developer = true;
    }
};



/**
 * @desc getDebug() checks if debug mode is turned on
 * @return {boolean} true if debug mode is on, false otherwise
**/
exports.getDebug = function () {
    return globalVariables.debug;
};

/*
 ********** END API FUNCTIONS *********
 */


/**
 * @desc setup() DO NOT call this in your hardware interface. setup() is only called from server.js to pass through some global variables.
**/
exports.setup = function (objExp, objLookup, glblVars, dir, plugins, cb, objValue) {
    objectExp = objExp;
    objectLookup = objLookup;
    globalVariables = glblVars;
    dirnameO = dir;
    pluginModules = plugins;
    callback = cb;
    ObjectValue = objValue;
};