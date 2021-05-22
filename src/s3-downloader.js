const System = require("pid-system");
const AWS = require('aws-sdk');
var fs = require('fs');

module.exports = async function() {
    this.dictionary.instanceId = Date.now();
    System.send("system-logger", [Date.now(), "INFO", "s3-downloader", this.dictionary.instanceId, "created"]);
    System.send("system-configuration", ["s3-downloader", this]);
    while (true) {
        let [localFilePath, s3Params, rej, res] = await this.receive();

        System.send("system-logger", [Date.now(), "INFO", "s3-downloader", this.dictionary.instanceId, "message received"]);
        System.send("system-logger", [Date.now(), "DEBUG", "s3-downloader", this.dictionary.instanceId, "message received: ", [localFilePath, s3Params]]);

        try {
            await new Promise((resolve, reject) => {
              AWS.config.update({
                  region: this.dictionary.region || "us-west-2"
              });
              s3 = new AWS.S3({
                  apiVersion: '2006-03-01'
              });
                s3.getObject(s3Params, (er, data) => {
                    if (er) {
                        reject(er);
                    } else {
                        fs.writeFile(localFilePath, data.Body, (e) => {
                          if(e){
                            reject(e);
                          } else {
                            resolve()
                          }
                        });
                    }
                })

            })
            System.send("system-logger", [Date.now(), "INFO", "s3-downloader", this.dictionary.instanceId, "done"]);
            res?.(localFilePath);
        } catch (e) {
            System.send("system-logger", [Date.now(), "ERROR", "s3-downloader", this.dictionary.instanceId, "unable to upload:" + "\r\n" + e.stack]);
            rej?.(e);
        }

    }
}
