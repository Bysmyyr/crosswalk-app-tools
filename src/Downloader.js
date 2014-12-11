// Copyright © 2014 Intel Corporation. All rights reserved.
// Use  of this  source  code is  governed by  an Apache v2
// license that can be found in the LICENSE-APACHE-V2 file.

var FS = require("fs");
var Http = require("http");
var Url = require("url");

var Config = require("./Config");



/**
 * Callback signature for {@link Downloader.get}
 * @memberOf Downloader
 * @inner
 */
function downloadFinishedCb(errormsg) {}



/**
 * Create Downloader object.
 * @param {String} toPath Path do download to.
 * @throws {Downloader~FileCreationFailedError} If file toPath could not be opened.
 * @constructor
 */
function Downloader(toPath) {

    var options = {
        flags: "wx",
        mode: 0600
    };
    this._fp = FS.createWriteStream(toPath, options);

    if (!this._fp) {
        throw new FileCreationFailedError("Could not open file " + toPath);
    }

    this._downloaded = 0;
    this._contentLength = 0;
}

/**
 * Download file.
 * @function get
 * @param {String} url Url to download
 * @param {Function} callback see {@link Downloader~downloadFinishedCb}
 * @memberOf Downloader
 */
Downloader.prototype.get =
function(url, callback) {

    // Object can only be used once.
    if (!this._fp) {
        callback("Downloader object can only be used once");
        return;
    }

    Http.get(url, function(res) {

        if (res.statusCode != 200) {
            callback("Download failed: HTTP Status " + res.statusCode);
            return;
        }

        this._contentLength = res.headers["content-length"];

        res.on("error", function(e) {

            this._fp.end();
            this._fp = null;
            callback("Download failed: " + e.message);

        }.bind(this));

        res.on('data', function(data) {

            this._fp.write(data);
            this._downloaded += data.length;
            this.progress(this._downloaded / this._contentLength);

        }.bind(this));

        res.on('end', function() {

            this._fp.end();
            this._fp = null;
            callback(null);

        }.bind(this))

    }.bind(this));
};

Downloader.prototype.progress =
function(progress) {

};



/**
 * Creates a new FileCreationFailedError.
 * @extends Error
 * @param {String} message Error message.
 * @constructor
 * @memberOf Downloader
 * @inner
 */
function FileCreationFailedError(message) {
    Error.call(this, message);
}
FileCreationFailedError.prototype = Error.prototype;

Downloader.FileCreationFailedError = FileCreationFailedError;



module.exports = Downloader;