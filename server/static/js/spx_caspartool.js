// ************************************
// Client javascript for SPX Caspartool
// Functions in alphabetical order
// ************************************
// (c) 2020 tuomo@smartpx.fi
// MIT License
// ************************************


// Global App State
let APPSTATE = "INIT"; // see AppState()
document.onkeydown = checkKey;

socket.on('SPXMessage2Client', function (data) {
    // Handles messages coming from server to this client.
    // All comms using 'SPXMessage2Client' as a conduit with data object and
    // data.spxcmd as function identifier. Additional object values are payload.
    console.log('SPXMessage received', data)
    switch (data.spxcmd) {
        case 'updateServerIndicator':
            document.getElementById(data.indicator).style.color = data.color;
            break;

        case 'updateStatusText':
            document.getElementById('status').innerText = data.status;
            clearTimeout(localStorage.getItem('SPX_CT_StatusTimer'));
            statusTimer = setTimeout(function () { document.getElementById('status').innerText = ''; }, 3000);
            localStorage.setItem('SPX_CT_StatusTimer', statusTimer);
            break;

        default:
            console.log('Unknown SPXMessage2Client command: ' + data.command);
    }
});

// see also spx Init()
// ##########################################################################################################


function aFunctionTest() {
    // execute a test function on the server
    // this gets triggered by menu > ping
    console.log('Sending testfunction request to server. See server console / log with PING -identifier...')
    AJAXGET('/CCG/testfunction/');
}



function add() {
    // require ..... nothing
    // returns ..... posts a name of a file to server which reloads page
    var listname = prompt("Creating a new content list. Name?", "");
    if (listname != null && listname != "") {
        //alert('Call API to add new list and goto editor: ' + listname);
        console.log('Deleting', listname);
        post('', { filebasename: listname }, 'post');
    }
}


function addRow() {
    // add a new div-item to the itemList
    // require ..... nothing
    // returns ..... generates a new TG item to DOM
    let container = document.getElementById('itemList');
    let maxRows = document.querySelectorAll('.itemrow').length;
    let newItem = document.createElement("div");
    newItem.classList = 'itemrow spxFlexContainer';
    newItem.id = 'item' + maxRows;
    newItem.setAttribute('data-spx-playout','')
    newItem.onclick = function () { focusRow(this); };


    // field 0
    let inputF0 = document.createElement("input");
    inputF0.type = "text";
    inputF0.value = "Nimi";
    // inputF0.readOnly = true;
    inputF0.classList = 'name spx_input input_active spxFlexItem';
    inputF0.ondblclick = function () { setactive(this); };
    inputF0.onkeypress = function () { doit_onkeypress(event, this); };

    // field 1
    let inputF1 = document.createElement("input");
    inputF1.type = "text";
    inputF1.value = "Titteli";
    // inputF1.readOnly = true;
    inputF1.classList = 'titl spx_input input_active spxFlexItem';
    inputF1.ondblclick = function () { setactive(this); };
    inputF1.onkeypress = function () { doit_onkeypress(event, this); };

    // row icon
    let LineIcon = document.createElement('div');  // div at end of item
    let DeleIcon = document.createElement('div');   // innerDiv for delete
    let DragIcon = document.createElement('div');   // drag handle div
    let DeleLink = document.createElement('a');     // A link within innerDiv
    LineIcon.id = "LineIcon";
    LineIcon.classList.add("handle"); // #7 fix
    DeleIcon.style = "display:none;";
    DeleIcon.id = "deleteIcon";
    var Xchar = document.createTextNode("\u2716");
    DeleLink.appendChild(Xchar);
    DeleLink.style = "cursor:default;";
    DeleLink.onclick = function () { delRow(this.parentElement.parentElement.parentElement); }
    DragIcon.style = "display:block;cursor:n-resize;";
    var Dragchar = document.createTextNode("\u2630");
    DragIcon.appendChild(Dragchar);
    DragIcon.id = "dragIcon";
    LineIcon.appendChild(DragIcon);
    DeleIcon.appendChild(DeleLink)
    LineIcon.appendChild(DeleIcon)

    // chain objects and add to DOM
    newItem.appendChild(inputF0);
    newItem.appendChild(inputF1);
    newItem.appendChild(LineIcon);
    container.appendChild(newItem);
    AppState('EDITING');
    inputF0.focus();
    inputF0.select();

    // added to fix #7 (this function on the page)
    initSortable();
}



function AJAXGET(URL) {
    // Sends a GET request to Caspartool server.
    // require ..... URL (such as '/CCG/testfunction/' )
    // returns ..... nothing
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            if (this.responseText) {
                // console.log('AJAX completed succesfully.')
            }
        }
        if (this.readyState == 4 && this.status != 200) {
            console.log('Ajax error, status: ' + this.status + ', state: ' + this.readyState);
        }
    };
    xmlhttp.open("GET", URL);
    xmlhttp.send();
} // AJAXGET ended





function AppState(NewState) {
    // **********************************************************************
    //
    // Options for global application state. This can be utilized
    // by several function around the application. You can use APPSTATE
    // statement in devtools to see the currently active state...
    // 
    //      Usage: AppState('DEFAULT');
    //
    //      APPSTATE = "DEFAULT" ......... nothing special
    //      APPSTATE = "INIT" ............ initialization of the page
    //      APPSTATE = "EDITING" ......... editing a text field (allow spaces)
    //
    console.log('Old state: ' + APPSTATE, 'New state: ' + NewState);
    APPSTATE = NewState;
    //
    // **********************************************************************
}



function cas() {
    // Opens the selected (or current) file in Caspartool controller.
    // Function works both in Edit and Lists -views.
    // require ..... nothing
    // returns ..... reloads the browser to another URL
    let filename = "";
    let element = "";
    element = document.getElementById("lists");
    if (typeof (element) != 'undefined' && element != null) {
        filename = element.value;
    }

    element = document.getElementById("filebasename");
    if (typeof (element) != 'undefined' && element != null) {
        filename = element.value;
    }
    document.location = '/caspartool/' + filename;
} // cas ended


function checkAllConnections() {
    // require ..... nothing
    // returns ..... forces server to check for CCG connections and pushes updates to indicators via socket.io
    function aFunctionTest() {
        // execute a test function on the server
        AJAXGET('/CCG/testfunction/');
    }
}


function checkKey(e) {
    // require ..... keyboard event
    // returns ..... executes keyboard shortcuts, such as applies "Return" to a text field while editing.
    // keybord shortcuts (see https://keycode.info/)

    if (APPSTATE == "EDITING") return;
    e = e || window.event;
    switch (e.keyCode) {

        case 13: // enter
            let activeRow = document.querySelector('.inFocus');
            let activeField = activeRow.querySelector('.name');
            setactive(activeField);
            setTimeout(function () { activeField.focus(); }, 10);
            setTimeout(function () { activeField.select(); }, 20);
            AppState('EDITING');
            e.preventDefault(); //prevent default
            break;


        case 38: // up
            moveFocus('up');
            break;

        case 40: // down
            moveFocus('down');
            break;


        // TODO: Add your desired keyboard shortcut functions here.

    }
}





function clearAttributes(attName, attValue) {
    // This is called from TGbuttonAction when TG Play button is
    // pressed. This clears all found attName/attValues which
    // forces the play/stop panel to show up upon focus.
    // require ..... attribute name ("data-name") and value ("jack") to search for clearing
    // returns ..... removes green arrow from TG list DOM
    let TGrows = document.querySelectorAll('.itemrow');
    TGrows.forEach(function (item) {
        if (item.getAttribute(attName) == attValue) {
            item.setAttribute(attName, '');
            item.querySelector("#dragIcon").innerHTML = "&#9776"; // drag icon
            item.querySelector("#dragIcon").classList.remove("green");
        }
    })
} // clearAttributes ended



function clearUsedChannels(ServerName) {
    // will call a command over API which will clear passed channels
    // first we will need to iterate current profile for channels
    // used by current profile.
    let data = {};
    data.server = ServerName;
    data.profile = localStorage.SPX_CT_ProfileName; // get from local storage
    data.element = 'dummy';
    AJAXGET('/CCG/clearchannels/' + JSON.stringify(data));

    // and reload to reset all play buttons
    location.reload();

}


function ClockOnOff() {
    // toggle play/stop state of clock
    // console.log('ClockOnOff()');
    let SenderBtn = document.getElementById('clockBtn');
    let data = {};
    data.element = 'clock';
    data.profile = localStorage.SPX_CT_ProfileName;
    let CurStatus = SenderBtn.getAttribute('data-spx-state') || '';
    if (CurStatus == "PLAYING") {
        // console.log('currently playing, so stop clock play and make button green play');
        SenderBtn.setAttribute('data-spx-state', '');
        SenderBtn.innerText = SenderBtn.getAttribute('data-spx-playtext');
        data.command = 'STOP';
        SenderBtn.classList.remove('bg_red');
        SenderBtn.classList.add('bg_green');
        AJAXGET('/CCG/control/' + JSON.stringify(data));
    }
    else {
        // console.log('currently stopped, so start play and make button red stop');
        SenderBtn.setAttribute('data-spx-state', 'PLAYING');
        SenderBtn.innerText = SenderBtn.getAttribute('data-spx-stoptext');
        data.command = 'ADD';
        SenderBtn.classList.remove('bg_green');
        SenderBtn.classList.add('bg_red');
        AJAXGET('/CCG/control/' + JSON.stringify(data));
    }
} // clock end




function CollectJSONFromDOM() {
    // iterate DOM and collect data to an array of objects
    // This is called by saveData().
    // console.log('Collecting JSON');
    let JSONdata = [];
    let Items = document.querySelectorAll('.itemrow');
    Items.forEach(function (item) {
        var dataname = item.getElementsByTagName("input")[0].value;
        var datatitl = item.getElementsByTagName("input")[1].value;
        var Item = {};
        Item.f0 = dataname;
        Item.f1 = datatitl;
        JSONdata.push(Item)
    })
    // console.log(JSONdata);
    return JSONdata;
} // CollectJSONFromDOM ended





function del() {
    // Delete a datafile from disk.
    // Called from delete button in lists page.
    var filename = document.getElementById('lists').value;
    fetch('/contentlists/' + filename, { method: 'DELETE' });
    location.reload();
} // del ended




function delRow(e) {
    //console.log('Would delete', e);
    document.getElementById('itemList').removeChild(e);
    // save data 
    SaveData();
} // delRow ended




function doit_onkeypress(event, e) {
    // end editing a TG field
    if (APPSTATE != "EDITING") return;
    // console.log('keycode', event.keyCode);
    if (event.keyCode == 13 || event.which == 13) {
        // console.log(e.id);
        setinactive(e);
    }
} // doit_onkeypress ended


function edi() {
    // Edit a datafile on disk.
    // Called from edit button in lists page.
    var filename = document.getElementById('lists').value;
    document.location = '/contentlists/' + filename;
} // edi ended



function EnableJustOneButton(clickedID = '') {
    // ACTIVATE ALL
    let buttonList = ['tgbtn1stop', 'tgbtn1play', 'tgbtn2stop', 'tgbtn2play', 'tgbtn3stop', 'tgbtn3play'];
    buttonList.forEach(function (item) {
        if (document.getElementById(item)) {
            document.getElementById(item).classList.remove('disabled_btn');
        }
        else {
            // console.log('Fail to remove disabled class from ', item);
        }
    })

    // DEACTIVE ALL BUT ONE
    if (clickedID == '') return;

    console.log('Haetaan buttonin nimeä', clickedID);
    let disableThese = "";
    switch (clickedID) {
        case 'tgbtn1play':
        case 'tgbtn1stop':
            disableThese = ['tgbtn2stop', 'tgbtn2play', 'tgbtn3stop', 'tgbtn3play'];
            break;

        case 'tgbtn2play':
        case 'tgbtn2stop':
            disableThese = ['tgbtn1stop', 'tgbtn1play', 'tgbtn3stop', 'tgbtn3play'];
            break;

        case 'tgbtn3play':
        case 'tgbtn3stop':
            disableThese = ['tgbtn1stop', 'tgbtn1play', 'tgbtn3stop', 'tgbtn3play'];
            break;

        default:
            break;
    }

    disableThese.forEach(function (item) {
        if (document.getElementById(item)) {
            document.getElementById(item).classList.add('disabled_btn');
        }
        else {
            // console.log('Fail to add disabled class to ', item);
        }
    })

} // EnableJustOneButton ended




function FloCommand(cmd) {
    // toggle play/stop state of flockler -ticker. 
    let CurCmd = cmd.toUpperCase();
    let SenderBtn = document.getElementById('FloBtn1');
    let data = {};
    data.element = 'flockler';
    data.profile = localStorage.SPX_CT_ProfileName;
    localStorage.setItem('SPX_CT_flocklerID', document.getElementById('flocklerID').value);
    localStorage.setItem('SPX_CT_flocklerPosts', document.getElementById('flocklerPosts').value);

    switch (CurCmd) {
        case 'TOGGLE':
            let CurStatus = SenderBtn.getAttribute('data-spx-state') || '';
            if (CurStatus == "PLAYING") {
                // console.log('currently playing, so stop play and make button green play');
                SenderBtn.setAttribute('data-spx-state', '');
                SenderBtn.innerText = SenderBtn.getAttribute('data-spx-playtext');
                data.command = 'STOP';
                SenderBtn.classList.remove('bg_red');
                SenderBtn.classList.add('bg_green');
                AJAXGET('/CCG/control/' + JSON.stringify(data));
            }
            else {
                // console.log('currently stopped, so start PLAY and make button red stop');
                SenderBtn.setAttribute('data-spx-state', 'PLAYING');
                SenderBtn.innerText = SenderBtn.getAttribute('data-spx-stoptext');
                data.command = 'ADD';
                data.jsonData = {
                    'f0': document.getElementById('flocklerID').value,
                    'f1': '',
                    'f2': '',
                    'f3': document.getElementById('flocklerPosts').value,
                    'f4': 'false'
                };
                AJAXGET('/CCG/controljson/' + JSON.stringify(data));
                SenderBtn.classList.remove('bg_green');
                SenderBtn.classList.add('bg_red');
            }
            break;

        case 'UPDATE':
            // issue #2 fixed (after headline / ticker were separated)
            data.command = 'UPDATE';
            data.jsonData = {
                'f0': document.getElementById('flocklerID').value,
                'f1': '',
                'f2': '',
                'f3': document.getElementById('flocklerPosts').value,
                'f4': 'false'
            };
            AJAXGET('/CCG/controljson/' + JSON.stringify(data));
            break;

        default:
    }
} // FloCommand end








function focusRow(e) {
    // will make TG item focused
    // and will set TG button states.
    let rows = document.querySelectorAll('.itemrow');
    rows.forEach(function (item) {
        let classes = item.classList;
        if (classes.contains("inFocus")) {
            item.classList.remove('inFocus');
        }
    })
    e.classList.add('inFocus');
    setTGButtonStates(e);
} // focusRow ended







function FXcommand(nro) {
    // Handles IMS playout, stop and update button events.
    // cmd is the command
    // nro is a number of IMS controller 1..4
    // console.log('FXcommand()', nro);
    let Senderbtn = document.getElementById('FXbtn' + nro);
    let data = {};
    data.element = 'FX' + nro;
    data.profile = localStorage.SPX_CT_ProfileName;

    let CurStatus = Senderbtn.getAttribute('data-spx-state') || '';
    if (CurStatus == "PLAYING") {
        // make button GREEN 'FX Play'
        Senderbtn.classList.remove('bg_red');
        Senderbtn.classList.add('bg_green');
        Senderbtn.setAttribute('data-spx-state', '');
        Senderbtn.innerText = Senderbtn.getAttribute('data-spx-playtext');
        f0 = document.getElementById('ims' + nro).value || ' '; // must be SPACE here for empty to avoid [Object object]
        data.command = 'STOP';
        AJAXGET('/CCG/controlfx/' + JSON.stringify(data));
    }
    else {
        // make button RED 'Stop'
        Senderbtn.classList.remove('bg_green');
        Senderbtn.classList.add('bg_red');
        Senderbtn.setAttribute('data-spx-state', 'PLAYING');
        Senderbtn.innerText = Senderbtn.getAttribute('data-spx-stoptext');
        data.command = 'ADD';
        AJAXGET('/CCG/controlfx/' + JSON.stringify(data));
    }
} // FXcommand ended


function getLayerFromProfile(buttonName) {
    // Make JSON from profiledata string from a hidden field and search it...
    // console.log('Searching layer for ' + buttonName);
    // This is a utility which is called bu Vue when checking button states.
    let profiledata = JSON.parse(document.getElementById('profiledata').value);
    let prfName = document.getElementById('profname').innerText.toUpperCase();
    for (var i = 0; i < profiledata.profiles.length; i++) {
        let curName = profiledata.profiles[i].name.toUpperCase();
        if (curName == prfName) {
            let SRV = profiledata.profiles[i].templates[buttonName].server;
            let CHA = profiledata.profiles[i].templates[buttonName].channel;
            let LAY = profiledata.profiles[i].templates[buttonName].layer;
            let CCG = SRV + " " + CHA + " " + LAY;
            // console.log("Render layer of [" + buttonName + "] in profile [" + prfName + "] is [" + CCG + "].");
            return CCG;
        }
    }
} // getLayerFromProfile ended






function Headline(cmd) {
    // toggle play/stop state of headline and store to localstorage
    let CurCmd = cmd.toUpperCase();
    let SenderBtn = document.getElementById('headlineBtn');
    let data = {};
    data.element = 'headline';
    data.profile = localStorage.SPX_CT_ProfileName;

    let line1 = document.getElementById('headline1').value;
    let line2 = document.getElementById('headline2').value;

    localStorage.setItem('SPX_CT_headline1', line1);
    localStorage.setItem('SPX_CT_headline2', line2);

    // Issue #5 fixed, see also SwapCharacters()
    line1 = swap2HTMLntities(line1);
    line2 = swap2HTMLntities(line2);

    data.jsonData = {
        'f0': line1,
        'f1': line2
    };

    switch (CurCmd) {
        case 'TOGGLE':
            let CurStatus = SenderBtn.getAttribute('data-spx-state') || '';
            if (CurStatus == "PLAYING") {
                // console.log('currently playing, so stop play and make button green play');
                SenderBtn.setAttribute('data-spx-state', '');
                SenderBtn.innerText = SenderBtn.getAttribute('data-spx-playtext');
                data.command = 'STOP';
                SenderBtn.classList.remove('bg_red');
                SenderBtn.classList.add('bg_green');
                AJAXGET('/CCG/control/' + JSON.stringify(data));
            }
            else {
                // console.log('currently stopped, so start PLAY and make button red stop');
                SenderBtn.setAttribute('data-spx-state', 'PLAYING');
                SenderBtn.innerText = SenderBtn.getAttribute('data-spx-stoptext');
                data.command = 'ADD';
                AJAXGET('/CCG/controljson/' + JSON.stringify(data));
                SenderBtn.classList.remove('bg_green');
                SenderBtn.classList.add('bg_red');
            }
            break;

        case 'UPDATE':
            data.command = 'UPDATE';
            AJAXGET('/CCG/controljson/' + JSON.stringify(data));
            break;

        default:
    }
} // headline end






function IMSdialog(nro) {
    // Open IMS window and store sender for processing by messageHandler
    console.log('Opening IMS dialog', nro);
    localStorage.setItem('SPX_CT_IMS_requestField', nro);
    window.addEventListener("message", IMSmessageHandler, false);
    window.open('https://ims.yle.fi/app', 'IMS', '_blank,width=980,height=800,scrollbars=yes,location=yes,status=yes');
} // end IMSdialog


function IMSmessageHandler(event) {
    // Handle incoming data message from IMS window
    if (event.origin !== 'https://ims.yle.fi') {
        return;
    }
    var image_public_id = event.data.images_api_id;
    console.log('IMS Image ID', image_public_id);
    event.source.postMessage('done', event.origin);
    let IMSnro = localStorage.getItem('SPX_CT_IMS_requestField');
    let FieldID = 'ims' + IMSnro;
    let targetElement = document.getElementById(FieldID);
    targetElement.value = image_public_id;
    localStorage.setItem('SPX_CT_' + FieldID, image_public_id);
    document.getElementById('imsBtn' + IMSnro + 'B').classList.remove('disabled');
} // end IMSmessageHandler


function IMSchangeButtonState(IMSnro, targetstate) {
    // toggle IMS button states
    let Senderbtn = document.getElementById('imsBtn' + IMSnro + 'A');
    if (targetstate == "PLAYING") {
        // make button RED 'Stop'
        Senderbtn.classList.remove('bg_green');
        Senderbtn.classList.add('bg_red');
        Senderbtn.setAttribute('data-spx-state', 'PLAYING');
        Senderbtn.innerText = Senderbtn.getAttribute('data-spx-stoptext');
    }
    else {
        // make button GREEN 'Play'
        Senderbtn.classList.remove('bg_red');
        Senderbtn.classList.add('bg_green');
        Senderbtn.setAttribute('data-spx-state', '');
        Senderbtn.innerText = Senderbtn.getAttribute('data-spx-playtext');
    }
} // end IMSchangeButtonState


function IMScommand(cmd, nro) {
    // Handles IMS playout, stop and update button events.
    // cmd is the command
    // nro is a number of IMS controller 1..4
    // console.log('IMScommand()', cmd, nro);
    let Senderbtn = document.getElementById('imsBtn' + nro + 'A')
    let sysCmd = cmd.toUpperCase();
    let data = {};
    data.element = 'ims' + nro;
    data.profile = localStorage.SPX_CT_ProfileName;

    switch (sysCmd) {
        case 'TOGGLE':
            let CurStatus = Senderbtn.getAttribute('data-spx-state') || '';
            if (CurStatus == "PLAYING") {
                // console.log('currently playing, so stop play and make button green');
                IMSchangeButtonState(nro, '')
                data.command = 'STOP';
                AJAXGET('/CCG/control/' + JSON.stringify(data));
                document.getElementById('imsBtn' + nro + 'B').classList.add('disabled');
            }
            else {
                // currently stopped, so play
                // console.log('currently stopped, so start the play and make button red');
                IMSchangeButtonState(nro, 'PLAYING')
                document.getElementById('imsBtn' + nro + 'B').classList.add('disabled');
                f0 = document.getElementById('ims' + nro).value || ' '; // must be SPACE here for empty to avoid [Object object]
                data.command = 'ADD';
                data.jsonData = { 'f0': f0 };
                AJAXGET('/CCG/controljson/' + JSON.stringify(data));
            }
            break;

        case 'UPDATE':
            // console.log('IMS update nro ' + nro);
            IMSchangeButtonState(nro, 'PLAYING')
            data.command = 'UPDATE';
            f0 = document.getElementById('ims' + nro).value || ' '; // must be SPACE here for empty to avoid [Object object]
            data.jsonData = { 'f0': f0 };
            AJAXGET('/CCG/controljson/' + JSON.stringify(data));
            document.getElementById('imsBtn' + nro + 'B').classList.add('disabled');
            // console.log('Updated');
            break;


        default:
            break;
    }
} // end IMScommand


function moveFocus(direction) {
    // Move highlighted row up/down with keyboard commands
    document.getElementById('item0').querySelector('input').focus();
    let newFocusID = "";
    let activeItem = document.querySelector('.inFocus');
    let maxRows = document.querySelectorAll('.itemrow').length;
    if (activeItem != null) {
        let activeRow = document.querySelector('.inFocus').id;
        let activeNR = parseInt(activeRow.replace("item", ""));
        let newNro = activeNR;
        if (direction === 'up' && activeNR > 0) {
            newNro = activeNR - 1;
        }
        if (direction === 'down' && activeNR < maxRows - 1) {
            newNro = activeNR + 1;
        }
        newFocusID = document.getElementById('item' + newNro);
    }
    else {
        newFocusID = document.getElementById('item0');
    }
    focusRow(newFocusID); // this function in GUI functions
} // moveFocus ended


function post(path, params, method) {
    // Creates a hidden form in DOM, populates it and posts it to server.
    // Feels dumb, but works, so what the heck.
    const form = document.createElement('form');
    form.method = method;
    form.action = path;
    for (const key in params) {
        if (params.hasOwnProperty(key)) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = key;
            hiddenField.value = params[key];
            form.appendChild(hiddenField);
        }
    }
    console.log('Doing', method, path)
    document.body.appendChild(form);
    form.submit();
} // post ended



function resizeInput() {
    // changes headline1 width
    this.style.width = (this.value.length + 1.2) + "ch";
} // resizeInput ended


function SaveData() {
    // this will save the currently opened json file using an ajax call
    let items = CollectJSONFromDOM();
    let basename = document.getElementById('filebasename').value;
    // console.log('Saving data', items);
    axios.post('/api/savefile/' + basename, { items })
        .then(function (response) {
            console.log(response);
        })
        .catch(function (error) {
            console.log(error);
        });
} // SaveData ended



function setactive(e) {
    // runs on dblClick of the item editor in TG list (or enter) to edit.
    AppState("EDITING");
    let thisRoot = e.parentElement;
    e1 = thisRoot.querySelector('.name');
    e2 = thisRoot.querySelector('.titl');
    e1.readOnly = false;
    e1.classList.remove("input_deactive");
    e1.classList.add("input_active");
    e2.readOnly = false;
    e2.classList.remove("input_deactive");
    e2.classList.add("input_active");

    // swap icons only when not on-air
    if (thisRoot.getAttribute('data-spx-playout') == '') {
        console.log('Swapping');
        thisRoot.querySelector('#deleteIcon').style.display = "block";
        thisRoot.querySelector('#dragIcon').style.display = "none";
    }
    else{
        console.log('Not swapping');
    }
} // setactive ended


function setinactive(e) {
    // runs when input field is submitted (enter key) after editing:
    let thisRoot = e.parentElement;
    e1 = thisRoot.querySelector('.name');
    e2 = thisRoot.querySelector('.titl');

    // de-select
    e1.focus();
    e1.selectionStart = 0;
    e1.selectionEnd = 0;

    // swap classes
    e1.readOnly = true;
    e1.classList.remove("input_active");
    e1.classList.add("input_deactive");
    e2.readOnly = true;
    e2.classList.remove("input_active");
    e2.classList.add("input_deactive");
    thisRoot.querySelector('#deleteIcon').style.display = "none";
    thisRoot.querySelector('#dragIcon').style.display = "block";

    // mark as changed (ready for update)
    thisRoot.setAttribute('data-spx-changed', 'changed');
    setTGButtonStates(thisRoot);

    // save data to disk
    SaveData();
    AppState("DEFAULT");
} // setinactive ended



function setTGButtonStates(focusedRow) {
    // this triggers when row focuses or when Play or Stop pressed or item changed.

    var element = document.getElementById("controls_play");
    if (typeof (element) == 'undefined' || element == null) {
        console.log('Info: setTGButtonStates() function is not needed in edit view, skipping...');
        return;
    }

    // Two distinct UI:s, one when playing on when not.
    let curGfx = focusedRow.getAttribute('data-spx-playout');
    let curSto = focusedRow.getAttribute('data-spx-stoptext');
    let curCng = focusedRow.getAttribute('data-spx-changed');
    // console.log('setTGButtonStates', focusedRow, curGfx);
    if (curGfx == "" || curGfx == null) {
        // empty, so show play
        document.getElementById('controls_stop').style.display = "none";
        document.getElementById('controls_play').style.display = "flex";
    }
    else {
        // started, so show stop button
        document.getElementById('stopbtn').innerText = curSto;
        document.getElementById('graphicInfo').innerText = 'Playing on ' + getLayerFromProfile(curGfx) + '.';
        document.getElementById('controls_stop').style.display = "flex";
        document.getElementById('controls_play').style.display = "none";
    }
    if (curCng != "changed") {
        document.getElementById('tgbtn4a').classList.add('disabled');
        document.getElementById('tgbtn4b').classList.add('disabled');
    }
    else {
        document.getElementById('tgbtn4a').classList.remove('disabled');
        document.getElementById('tgbtn4b').classList.remove('disabled');
    }
} // setTGButtonStates ended 






function spx_system(cmd) {
    // system command handler
    let sysCmd = cmd.toUpperCase()
    let data = {};
    switch (sysCmd) {
        case 'OPENDATAFOLDER':
            data.command = 'DATAFOLDER';
            break;

        case 'OPENTEMPLATEFOLDER':
            data.command = 'TEMPLATEFOLDER';
            break;

        case 'CHECKCONNECTIONS':
            data.command = 'CHECKCONNECTIONS';
            break;

        case 'RESTARTSERVER':
            // this will kill 'nodejs' -server and 'forever' utility will restart it again and again...
            data.command = 'RESTARTSERVER';
            data.reloadPage = true;
            break;

        default:
            console.log('Unknown spx_system identifer: ' + cmd);
            break;
    }
    AJAXGET('/CCG/system/' + JSON.stringify(data));
    if (data.reloadPage) {
        document.getElementById('SmartPX_App').style.opacity = '0.4';
        setTimeout('location.reload()', 2000);
    }
} // end spx_system


function spxInit() {
    // executes on page load:
    // - load values from localStorage
    // - init inputResizing
    // - init Sortable
    console.log('%c SPX Caspartool (c) 2020 <tuomo@smartpx.fi>', 'background: #6aF; color: #fff');
    // populate UI

    
    if (localStorage.SPX_CT_ProfileName){
        // profile from localstorage
        profileName = localStorage.SPX_CT_ProfileName;
    }
    else
    {
        // set 1'st profile active by default if localStorage was empty
        profileName = document.getElementById('prof0').innerText;
        localStorage.setItem('SPX_CT_ProfileName', profileName);
    }
    
    document.getElementById('profname').innerText = profileName;
    document.getElementById('ims1').value = localStorage.SPX_CT_ims1 || '';
    document.getElementById('ims2').value = localStorage.SPX_CT_ims2 || '';
    document.getElementById('ims3').value = localStorage.SPX_CT_ims3 || '';
    document.getElementById('ims4').value = localStorage.SPX_CT_ims4 || '';
    document.getElementById('headline1').value = localStorage.SPX_CT_headline1 || '';
    document.getElementById('headline2').value = localStorage.SPX_CT_headline2 || '';
    document.getElementById('flocklerID').value = localStorage.SPX_CT_flocklerID || '';
    document.getElementById('flocklerPosts').value = localStorage.SPX_CT_flocklerPosts || '';

    // init input resize
    var e = document.getElementById('headline1');
    e.addEventListener('input', resizeInput);
    resizeInput.call(e);
    focusRow(document.getElementById('item0'));

    // Init sortable and saveData onEnd
    Sortable.create(itemList, {
        handle: '.handle',
        animation: 150,
        onEnd: function (evt) {
            SaveData();
        },
    });
    AppState("DEFAULT");
} // end spxInit


function setProfile(profileName) {
    // change profile to profileName and save to localStorage
    if (profileName == '') {
        // retrieve from localStorage
        profileName = localStorage.SPX_CT_ProfileName || '...';
    }
    document.getElementById('profname').innerText = profileName;
    localStorage.SPX_CT_ProfileName = profileName;
} // setProfile ended




function spxAct(func, delay) {
    // if need be use this is button onClick="spxAct('cas',500);"
    console.log('Will trigger ' + func + ' after ' + delay + ' ms.');
    setTimeout(eval(func), delay);
} // spxAct ended



function SPXGFX_TG(caspartoolItem, cmd) {

    console.log('HOWDY');

    // this handles TG commands only
    let f0 = "";
    let f1 = "";
    let f2 = "";
    let f3 = "";
    let f4 = "";
    let ACTIVETG = document.querySelector('.inFocus');

    if (!ACTIVETG) {
        console.log('WARNING! No row selected, select a TG and try again.');
        return
    }



    // Issue #5 fixed, see also SwapCharacters()
    f0 = swap2HTMLntities(ACTIVETG.querySelector('.name').value) || ''; // must be SPACE here for empty to avoid [Object object]
    f1 = swap2HTMLntities(ACTIVETG.querySelector('.titl').value) || ''; // -"-
    // f0 = ACTIVETG.querySelector('.name').value || ' '; // must be SPACE here for empty to avoid [Object object]
    // f1 = ACTIVETG.querySelector('.titl').value || ' '; // -"-

    console.log('Fixed name/value: [' + f0 + '][' + f1 + ']');


    let data = {};
    data.element = caspartoolItem;                  // used to search profiledata
    data.profile = localStorage.SPX_CT_ProfileName; // get from local storage
    data.fields = [
        { id: 'f0', value: encodeURIComponent(f0) },
        { id: 'f1', value: encodeURIComponent(f1) },
        { id: 'f2', value: f2 },
        { id: 'f3', value: f3 },
        { id: 'f4', value: f4 }
    ];


    // console.log("DATA",JSON.stringify(data));
    // console.log("DATA ENCODED",encodeURIComponent(JSON.stringify(data)));


        switch (cmd) {
        case 'PLAY':
            // starting play
            data.command = 'ADD';
            AJAXGET('/CCG/control/' + JSON.stringify(data)); // encoding added and remived

            // define play icon: left, right or up
            let tgElement = data.element.toUpperCase();
            let PlayIcon = "&#9654"; // arrow right is the default play icon
            switch (tgElement) {
                case 'NAME_LEFT':
                    PlayIcon = "&#9664"; // arrow left
                    break;
                case 'NAME_LIVE':
                    PlayIcon = "&#9650"; // arrow up
                    break;
            }
            ACTIVETG.querySelector("#dragIcon").innerHTML = PlayIcon;
            ACTIVETG.querySelector("#dragIcon").classList.add("green");
            break;

        case 'STOP':
            // stopping and clearing item
            data.command = 'STOP';
            AJAXGET('/CCG/control/' + JSON.stringify(data));
            let LeftAttr = ACTIVETG.getAttribute('data-spx-playleft');
            let RighAttr = ACTIVETG.getAttribute('data-spx-playright');
            let LiveAttr = ACTIVETG.getAttribute('data-spx-playlive');
            // console.log('[' + LeftAttr + '|' + RighAttr + '|' + LiveAttr + ']');
            if (!LeftAttr && !RighAttr && !LiveAttr) {
                ACTIVETG.querySelector("#dragIcon").innerHTML = "&#9776"; // drag icon
                ACTIVETG.querySelector("#dragIcon").classList.remove("green");
            }
            break;

        case 'UPDATE':
            if (caspartoolItem.classList.contains('disabled')) {
                // This works, but stinks. The 1st argument is a DOM element
                // with UPDATE command, whereas with play, the argument is a 
                // template_graphic identifier string. Yuck >:-P
                return false;
            }
            data.command = 'UPDATE';
            data.element = ACTIVETG.getAttribute('data-spx-playout');
            AJAXGET('/CCG/control/' + JSON.stringify(data));
            ACTIVETG.setAttribute('data-spx-changed', '');
            break;

        default:
            console.log('Unknown SPXGFX command!');
    }
    setTGButtonStates(document.querySelector('.inFocus'));
} // SPXGFX_TG ended



function swap2HTMLntities(str){
    // This fixes issue #5 re special characters
    str = str.replace(/\\/g,    "&#92;") // html entity for backslash
    str = str.replace(/"/g,     "&#34;") // html entity for dblquote
    str = encodeURIComponent(str);       // handle the rest
    return str;
}



function TGbuttonActionPLAY(item) {
    // Each TG button executes this!
    let ACTIVETG = document.querySelector('.inFocus');
    if (!ACTIVETG) {
        console.log('INFORMATION: No row selected, stopping.');
        return
    }
    let clickedID = item.id;
    let GfxAttr = document.getElementById(clickedID).getAttribute('data-spx-graphic');
    let StopTxt = document.getElementById(clickedID).getAttribute('data-spx-stoptext');
    clearAttributes('data-spx-playout', GfxAttr);
    ACTIVETG.setAttribute('data-spx-playout', GfxAttr);
    ACTIVETG.setAttribute('data-spx-stoptext', StopTxt);
    ACTIVETG.setAttribute('data-spx-changed', '');
    SPXGFX_TG(GfxAttr, 'PLAY');
    setTGButtonStates(ACTIVETG);
    // console.log('TGButtonPlay done.');

    // Storing the same values to RE-PLAY button, just in case
    document.getElementById('tgbtnplayagain').setAttribute('data-spx-graphic', GfxAttr);
    document.getElementById('tgbtnplayagain').setAttribute('data-spx-stoptext', StopTxt);
} // end TGbuttonActionPLAY



function TGbuttonActionSTOP(item) {
    // Stop TG button executes this
    let ACTIVETG = document.querySelector('.inFocus');
    if (!ACTIVETG) {
        console.log('INFORMATION: No row selected, stopping.');
        return
    }
    let GfxAttr = ACTIVETG.getAttribute('data-spx-playout');
    ACTIVETG.setAttribute('data-spx-playout', '');
    SPXGFX_TG(GfxAttr, 'STOP');
    setTGButtonStates(ACTIVETG);
} // end TGbuttonActionSTOP


