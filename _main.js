
/////////////////////////////////////////////////////////////////////
//                         BEGIN
/////////////////////////////////////////////////////////////////////

if (typeof GM_log != 'function') {
    alert("Your browser does not appear to support Greasemonkey scripts!");
    throw "Error: Your browser does not appear to support Greasemonkey scripts!";
}

gm.log("Starting");

/////////////////////////////////////////////////////////////////////
//                         Chrome Startup
/////////////////////////////////////////////////////////////////////

if (caapGlob.is_chrome) {
    try {
        var lastVersion = localStorage.getItem(caapGlob.gameName + '__LastVersion', 0);
        var shouldTryConvert = false;
        if (lastVersion) {
            if (lastVersion.substr(0, 1) == 's') {
                shouldTryConvert = true;
            }
        }

        if (caapVersion <= '140.21.9' || shouldTryConvert) {
            ConvertGMtoJSON();
        }
    } catch (e) {
        gm.log("Error converting DB: " + e);
    }

    try {
        CM_Listener();
    } catch (e) {
        gm.log("Error loading CM_Listener" + e);
    }
}

/////////////////////////////////////////////////////////////////////
//                         Set Title
/////////////////////////////////////////////////////////////////////

if (gm.getValue('SetTitle')) {
    var DocumentTitle = '';
    if (gm.getValue('SetTitleAction', false)) {
        DocumentTitle += "Starting - ";
    }

    if (gm.getValue('SetTitleName', false)) {
        DocumentTitle += gm.getValue('PlayerName', 'CAAP') + " - ";
    }

    document.title = DocumentTitle + caapGlob.documentTitle;
}

/////////////////////////////////////////////////////////////////////
//                          GitHub updater
// Used by browsers other than Chrome (namely Firefox and Flock)
// to get updates from github.com
/////////////////////////////////////////////////////////////////////

if (!caapGlob.is_chrome) {
    try {
        if (gm.getValue('SUC_remote_version', 0) > caapVersion) {
            caapGlob.newVersionAvailable = true;
        }

        // update script from: http://github.com/Xotic750/Castle-Age-Autoplayer/raw/master/Castle-Age-Autoplayer.user.js

        function updateCheck(forced) {
            if ((forced) || (parseInt(gm.getValue('SUC_last_update', '0'), 10) + (86400000 * 1) <= (new Date().getTime()))) {
                try {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: 'http://github.com/Xotic750/Castle-Age-Autoplayer/raw/master/Castle-Age-Autoplayer.user.js',
                        headers: {'Cache-Control': 'no-cache'},
                        onload: function (resp) {
                            var rt = resp.responseText;
                            var remote_version = /@version\s*(.*?)\s*$/m.exec(rt)[1];
                            var script_name = (/@name\s*(.*?)\s*$/m.exec(rt))[1];
                            gm.setValue('SUC_last_update', new Date().getTime() + '');
                            gm.setValue('SUC_target_script_name', script_name);
                            gm.setValue('SUC_remote_version', remote_version);
                            gm.log('remote version ' + remote_version);
                            if (remote_version > caapVersion) {
                                caapGlob.newVersionAvailable = true;
                                if (forced) {
                                    if (confirm('There is an update available for the Greasemonkey script "' + script_name + '."\nWould you like to go to the install page now?')) {
                                        GM_openInTab('http://senses.ws/caap/index.php?topic=771.msg3582#msg3582');
                                    }
                                }
                            } else if (forced) {
                                alert('No update is available for "' + script_name + '."');
                            }
                        }
                    });
                } catch (err) {
                    if (forced) {
                        alert('An error occurred while checking for updates:\n' + err);
                    }
                }
            }
        }

        GM_registerMenuCommand(gm.getValue('SUC_target_script_name', '???') + ' - Manual Update Check', function () {
            updateCheck(true);
        });

        updateCheck(false);
    } catch (err) {
        gm.log("ERROR in GitHub updater: " + err);
    }
}

/////////////////////////////////////////////////////////////////////
// Put code to be run once to upgrade an old version's variables to
// new format or such here.
/////////////////////////////////////////////////////////////////////

if (gm.getValue('LastVersion', 0) != caapVersion) {
    try {
        if (parseInt(gm.getValue('LastVersion', 0), 10) < 121) {
            gm.setValue('WhenBattle', gm.getValue('WhenFight', 'Stamina Available'));
        }

        // This needs looking at, although not really used, need to check we are using caap keys
        if (parseInt(gm.getValue('LastVersion', 0), 10) < 126) {
            var storageKeys = GM_listValues();
            for (var key = 0; key < storageKeys.length; key += 1) {
                if (GM_getValue(storageKeys[key])) {
                    GM_setValue(storageKeys[key], GM_getValue(storageKeys[key]).toString().replace('~', caapGlob.os).replace('`', caapGlob.vs));
                }
            }
        }

        if (parseInt(gm.getValue('LastVersion', 0), 10) < 130 && gm.getValue('MonsterGeneral')) {
            gm.setValue('AttackGeneral', gm.getValue('MonsterGeneral'));
            gm.deleteValue('MonsterGeneral');
        }

        if (parseInt(gm.getValue('LastVersion', 0), 10) < 133) {
            var clearList = ['FreshMeatMaxLevel', 'FreshMeatARMax', 'FreshMeatARMin'];
            clearList.forEach(function (gmVal) {
                gm.setValue(gmVal, '');
            });
        }

        if ((gm.getValue('LastVersion', 0) < '140.15.3' || gm.getValue('LastVersion', 0) < '140.21.0') &&
                gm.getValue("actionOrder", '') !== '') {
            alert("You are using a user defined Action List!\n" +
                  "The Master Action List has changed!\n" +
                  "You must update your Action List!");
        }

        if (gm.getValue('LastVersion', 0) < '140.16.2') {
            for (var a = 1; a <= 5; a += 1) {
                var attribute = gm.getValue("Attribute" + a, '');
                if (attribute !== '') {
                    gm.setValue("Attribute" + a, attribute.ucFirst());
                    gm.log("Converted Attribute" + a + ": " + attribute + "   to: " + attribute.ucFirst());
                }
            }
        }

        gm.setValue('LastVersion', caapVersion);
    } catch (err) {
        gm.log("ERROR in Environment updater: " + err);
    }
}

/////////////////////////////////////////////////////////////////////
//                    On Page Load
/////////////////////////////////////////////////////////////////////

$(function () {
    gm.log('Full page load completed');
    gm.setValue('clickUrl', window.location.href);
    if (window.location.href.indexOf('facebook.com/castle_age/') >= 0) {
        gm.deleteValue("ArmyCount");
        gm.deleteValue('waiting');
        gm.setValue('caapPause', 'none');
        gm.setValue('ReleaseControl', true);
        gm.deleteValue("statsMatch");
        if (caapGlob.is_chrome) {
            CE_message("paused", null, gm.getValue('caapPause', 'none'));
        }

        nHtml.setTimeout(function () {
            caap.init();
        }, 200);
    }

    this.waitMilliSecs = 8000;
    caap.WaitMainLoop();
});

caap.ReloadOccasionally();

// ENDOFSCRIPT