
      import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';

      const firebaseConfig = {
      };
      const app = initializeApp(firebaseConfig);

      import './auth.js';
      import {callAuth} from './auth.js';
      import { getFirestore, collection, getDoc, doc, updateDoc, getDocs, setDoc} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js';
      import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';

      const auth = getAuth();
      const firestore = getFirestore(app);
      const schedulesCollection = collection(firestore, "schedules");

      //GLOBALS//
      
      let controlPanelIsOut = false;
      let controlPanelCalledFieldClick = false;
      let lastWeekceelEditedControlpanel = 0;
      let curWeekceelEditedControlpanel = 1;
      
      let eventMaxSymbolCount = 0;
      let currentSchedule = {};

      let teacherSelectorNames = [];

      let curMonthDays = 0;

      let appliedTeacherFilters = [];
      let appliedEventFilters = [];
      let curFiltersAppliedCounter = 0;
      let curFiltersFieldMaxRows = 10;

      const controlPanelMoveButton = document.getElementById("controlPanelMoveButton");

      let daysNumber = 0;

      let userNames = [];
      let classesArray = [];

      const generalSchedule = {};
      const filterColorsObject = {};
      let classColors = {};

      ////Function calls//
      const authFunctionality = {
        "login_status_check": checkAndRedirect,
        "login_page_redirect": redirectLoginpage,
      };

      ///Function calls/

      authFunctionality["login_status_check"]();

      function createBlocker () {
        const blocker = document.createElement("div");
        blocker.id = "blocker";
        blocker.classList.add("blocker");

        const parent_container = document.getElementById("parent_container");
        parent_container.append(blocker);

        console.log("blocker created new");
      }

      function removeBlocker () {
        const blocker = document.getElementById("blocker");
        blocker.remove();

        console.log("blocker removed new");
      }

      async function loadGlobals () {
        const classesDocRef = doc(schedulesCollection, "eventNames");
        const classesDocSnap = await getDoc(classesDocRef);
        const classesDocData = classesDocSnap.data();
        classesArray = classesDocData["events"];

        const classColorsDocRef = doc(schedulesCollection, "classColors");
        const classColorsDocSnap = await getDoc(classColorsDocRef);
        const classColorsDocData = classColorsDocSnap.data();
        classColors = classColorsDocData;
      }

      //Auth functionality and page loading.
      async function checkAndRedirect () {
            await new Promise((resolve) => {
                onAuthStateChanged(auth, (user) => {
                    resolve(user);
                });
            });

            const userCheck = auth.currentUser;

            if (userCheck) {
              let userUID = userCheck.uid;
              userUID = userUID.toString();

              await checkForUserDoc(userCheck);

              console.log("logged in succesfully");
              
              loadPage();
              postSchedule(userUID);
            } else {
              window.location.href = "/index.html";
              console.log("redirected");
            }
      };

      function redirectLoginpage() {

      }

      async function loadPage() {
        const curDate = new Date();
        curDate.setDate(1);
        const year = curDate.getFullYear();
        const month = curDate.getMonth();

        daysNumber = getDaysNumber(year,month);
        const startingCellNum = findStartingCell(curDate);

        createWeekcells(daysNumber, startingCellNum, curDate);
        calculateDivSymbolNumber("1_event_1", 0);

        loadSelectors();
        attachELControlPanel();
        loadGlobals();

        if(addKeyboardSelection()) {
          return true;
        } else {
          throw new Error("Failed to add kKeyboard selection");
        }
      }

      async function checkForUserDoc(userCheck) {
        const userUID = userCheck.uid;
        const email = userCheck.email;

        const userCollection = collection(firestore, "users");
        const docRef = doc(userCollection, userUID);

        const docSnap = await getDoc(docRef);
        const docSnapData = docSnap.data();

        if (!docSnapData) {
          const dataToSet = {
            "auth_level": "user",
            "email": `${email}`,
          };

          await setDoc(docRef, dataToSet);
        }
        
      }

      function addNewScheduleVariable (variableType) {
        const parentContainer = document.getElementById("parent_container");

        const newElementMenu = document.createElement("div");
        newElementMenu.textContent = "You are adding a new temporary variable. It will not be saved for future use.";
        newElementMenu.classList.add("");

        const inputField = document.createElement("input");
        inputField.type = "text";
        inputField.classList.add("");

        const addButton = document.createElement("button");
        addButton.classList.add("");
        addButton.textContent = "ADD";
        addButton.addEventListener("click", () => {
          if (variableType == "templateClass") {
            
          }
        });

        newElementMenu.append(inputField);
        newElementMenu.append(addButton);

        parentContainer.append(newElementMenu);
      }

      //Grid Generation for individual schedules.
      function createWeekcells(days , startingCellNum, curDate) {
          const childContainer = document.getElementById("child_container");
          childContainer.innerHTML = "";

          let startingCellAddedFlag = false;

          for (let a = 0; a < days; a++) {

            const weekcell = document.createElement("div");
            weekcell.className = "weekcells";

            if (!startingCellAddedFlag) {
              weekcell.style.gridColumnStart = startingCellNum.toString();
              startingCellAddedFlag = true;
            }

            childContainer.appendChild(weekcell);

            const scheduleDayParent = document.createElement("div");
            scheduleDayParent.id = `${a+1}`;
            scheduleDayParent.className = "schedule_day_parent";

            weekcell.appendChild(scheduleDayParent);
            weekcell.addEventListener("click", controlPanelOut);

            const dayMonthDate = document.createElement("div");
            dayMonthDate.className = "day_month_date textStyleDailyDate";

            const dateToSet = a+1;
            const checkDate = curDate;
            checkDate.setDate(dateToSet);
            let dayOfTheWeek = checkDate.getDay();

            switch (dayOfTheWeek) {
              case 0:
                dayOfTheWeek = 'Sunday';
                break;
              case 1:
                dayOfTheWeek = 'Monday'; 
                break;
              case 2:
                dayOfTheWeek = 'Tuesday';
                break;
              case 3:
                dayOfTheWeek = 'Wednesday';
                break;
              case 4:
                dayOfTheWeek = 'Thursday';
                break;
              case 5:
                dayOfTheWeek = 'Friday';
                break;
              case 6:
                dayOfTheWeek = 'Saturday';
                break;
              default:
                break;
            }

            dayMonthDate.textContent = `${dayOfTheWeek}, ${dateToSet}`;
            dayMonthDate.id =  `${a+1}_date`;
            scheduleDayParent.append(dayMonthDate);

            const events = 13;

            for (let b = 9; b - 9 < events; b++) {
              const scheduleItemTime = document.createElement('div');
              const scheduleItem = document.createElement('div');
              const scheduleItemRoom = document.createElement('div');

              scheduleItemTime.className = "schedule_item_time textStyleTimeSlots";
              /*Current weekcell(date of the month)_item type_item number */
              scheduleItemTime.id = `${a+1}_time_${b+1}`;
              scheduleItemTime.textContent = `${b}:00`;

              scheduleItem.className = "schedule_item textStyleCells";
              scheduleItem.id = `${a+1}_event_${b-9}`;
              scheduleItem.textContent = "";

              scheduleItemRoom.className = "schedule_item_room textStyleTimeSlots";
              scheduleItemRoom.id = `${a+1}_room_${b+1}`;

              scheduleDayParent.append(scheduleItemTime);
              scheduleDayParent.append(scheduleItem);
              scheduleDayParent.append(scheduleItemRoom);
            }

          };

          
        }


      //Updating selectors and setting up event listeners for them.
      async function loadSelectors() {
        teacherSelectorNames = new Array();

        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth()+1;
        const formattedCurrentMonth = currentMonth.length>1 ? currentMonth : `0${currentMonth}`

        const inputMonth = `${currentYear}-${formattedCurrentMonth}`;

        const usersCollection = collection(firestore, "users");
        
        const teachersNamesDocRef = doc(schedulesCollection, "schedulesUserNames");
        const docSnapshot = await getDoc(teachersNamesDocRef);
        const data = docSnapshot.data();
        userNames = data["usernames"];

        const monthSelector = document.getElementById("monthSelector");
        monthSelector.value = inputMonth;

        const teacherSelector = document.getElementById("teacherSelector");

        for (const userName of userNames) {
          const newOption = document.createElement("option");
          newOption.value = userName;
          newOption.class = "teacherSelectorClassText";
          newOption.textContent = userName;

          teacherSelectorNames.push(userName);

          teacherSelector.appendChild(newOption);
        };

        monthSelector.addEventListener("change", loadNewMonth);



        //Loading selectors to choose the person we are looking for.

        async function reactTeacherSelector() {
          if (controlPanelIsOut == false) {
            controlPanelIsOut = true;
          } else {
            controlPanelIsOut = false;
          }
          controlPanelInOut();

          //Add the regeneration function for the month here.
          const monthSelectorValue = monthSelector.value;
          const curInputMonth = monthSelector.value;

          const curTeacher = teacherSelector.value;
          const teachersDocRef = doc(schedulesCollection, curTeacher); 
          const teacherDocSnap = await getDoc(teachersDocRef);
          const teacherDocData = teacherDocSnap.data();
          const teacherMonths = teacherDocData["months"];

          const dateDaysDate = new Date(monthSelectorValue);
          dateDaysDate.setDate(1);
          const yearSet = dateDaysDate.getFullYear();
          const month = dateDaysDate.getMonth();

          curMonthDays = getDaysNumber(yearSet,month);

          const auth = getAuth();
          const currentUser = auth.currentUser;
          const currentUserUID = currentUser.uid;
          
          const userDocRef = doc(usersCollection, currentUserUID);
          const dataToSet = {
            "last_opened_schedule": curTeacher,
          }
          await updateDoc(userDocRef, dataToSet);

          if (teacherMonths.includes(curInputMonth)) {
            const teacherMonthSubcollection = collection(teachersDocRef,`${curInputMonth}`);
            const monthDateDocsSnap = await getDocs(teacherMonthSubcollection);

            const monthSelectorValueSplit = monthSelectorValue.split("-");
            const year = monthSelectorValueSplit[0];
            const curMonth = monthSelectorValueSplit[1];

            const startingCellDate = new Date();
            startingCellDate.setMonth(curMonth); //We account for different indexes by ignoring them since setDate 0 with getDate returns the last day (number of days) in the previous month.
            startingCellDate.setYear(year);
            startingCellDate.setDate(0);

            const numberOfDays = startingCellDate.getDate();

            const checkDate = new Date();
            checkDate.setYear(year);
            checkDate.setMonth(curMonth-1);
            checkDate.setDate(1);
            const startingCell = findStartingCell(checkDate);

            createWeekcells(numberOfDays,startingCell,checkDate);

            for (const document of monthDateDocsSnap.docs) {
              fillInDates(document);
            }
            
          } else {
            generateAndDisplayNewMonth(curInputMonth, curTeacher);
          }

        }

        teacherSelector.addEventListener("change", reactTeacherSelector);
    }



      //Month generation called when we change the teacher or the month.
      async function generateAndDisplayNewMonth(curMonthInput, curTeacher) {
        const curMonthSplit = curMonthInput.split("-");
        const curYear = curMonthSplit[0];
        const curMonth = curMonthSplit[1];

        const newDate = new Date();
        newDate.setYear(curYear);
        newDate.setMonth(curMonth);
        newDate.setDate(0);
        const numberOfDays = newDate.getDate();

        const newMonthTeacherDocRef = doc(schedulesCollection, curTeacher);
        const newMonthTeacherDocSnap = await getDoc(newMonthTeacherDocRef);
        const newMonthTeacherDocData = newMonthTeacherDocSnap.data();

        let currentMonths = newMonthTeacherDocData["months"];
        currentMonths.push(`${curYear}-${curMonth}`);

        const newMonthsData = {
          "months": currentMonths,
        };

        await updateDoc(newMonthTeacherDocRef,newMonthsData);

        const subCollectionMonthRef = collection(newMonthTeacherDocRef, curMonthInput);

        for (let i = 0; i < numberOfDays; i++) {
          const curDate = i+1;
          const newDateDocRef = doc(subCollectionMonthRef, `${curDate}`);
          await setDoc(newDateDocRef, {});
        }

        const childrenContainerDays = document.getElementById("child_container");
        childrenContainerDays.innerHTML = "";

        const startingCellDate = newDate;
        startingCellDate.setMonth(curMonth-1);
        startingCellDate.setDate(1);
        const startingCell = findStartingCell(startingCellDate);

        createWeekcells(numberOfDays, startingCell, startingCellDate);
      }


      //Called when we switch between schedule types (individual//general)
      async function chooseLoadSchedule(scheduleType) {
        createBlocker();

        if (scheduleType == "general") {
          await generateGeneralSchedule();
        } else if (scheduleType == "individual") {
          await generateIndividualSchedule();
        }

        removeBlocker();
      }


      //Loading the individual schedule
      async function generateIndividualSchedule() {

        const teacherSelector = document.getElementById("teacherSelector");
        try {
          teacherSelector.style.display = "";
        } catch {

        }

        const monthSelector = document.getElementById("monthSelector");
        try {
          monthSelector.style.display = "";
        } catch{

        }

        const teacherTemplateSelector = document.getElementById("templateTeacherSelector");
        try {
          teacherTemplateSelector.style.display = "none";
        } catch {

        }

        const templateContainer = document.getElementById("templateContainer");
        try {
          templateContainer.remove()
        } catch {

        }

        const generalScheduleDateInput = document.getElementById("generalScheduleDate");
        
        if (generalScheduleDateInput) {
          console.log('removed general schedule date');
          generalScheduleDateInput.remove();
        }

        const generalScheduleGrid = document.getElementById("generalScheduleGrid");
        if (generalScheduleGrid) {
          generalScheduleGrid.remove();
        }

        const controlPanelArrow = document.getElementById("controlPanelMoveButton");
        controlPanelMoveButton.style.display = "";

        const result = await loadPage();

        return new Promise((resolve, reject) => {
          if (result){
            resolve();
          } else{
            reject();
          }
        });
      }

      //Loading the general schedule
      async function generateGeneralSchedule(){

        let inputDate = 0;

        if (controlPanelIsOut == true) {
          controlPanelInOut();
        }

        function setDefaultDate() {

          const newDate = new Date();
          const newYear = newDate.getFullYear();
          const newMonth = String(newDate.getMonth() + 1).padStart(2, "0");
          const newDateUnedited = String(newDate.getDate());

          const newDay = newDateUnedited.padStart(2,"0");

          let newDateInput = `${newYear}-${newMonth}-${newDay}`;

          return newDateInput;
        }

        //This function exists to remove the previously existing selectors and change them to new selectors without updating the page.
        function updateInputsAndSelectors(inputDate){
          
          const teacherSelector = document.getElementById("teacherSelector");
          try {
            teacherSelector.style.display = "none";
          } catch {

          }

          const monthSelector = document.getElementById("monthSelector");
          try {
            monthSelector.style.display = "none";
          } catch{

          }

          const teacherTemplateSelector = document.getElementById("templateTeacherSelector");
          try {
            teacherTemplateSelector.style.display = "none";
          } catch {

          }

          const templateContainer = document.getElementById("templateContainer");
          try {
            templateContainer.remove()
          } catch {

          }

          function createDateInput () {
            const parentContainer = document.getElementById("parent_container");

            const generalScheduleDateInput = document.createElement("input");
            generalScheduleDateInput.type = "date";
            generalScheduleDateInput.id = "generalScheduleDate";
            generalScheduleDateInput.classList.add("globalScheduleDateInput");
            generalScheduleDateInput.value = inputDate;

            parentContainer.append(generalScheduleDateInput);
          }

          const generalScheduleDateInput = document.getElementById("generalScheduleDate");
          
          if (!generalScheduleDateInput) {
            createDateInput();
          }
          
        }

        function clearPreviousSchedule() {
          const childContainer = document.getElementById("child_container");
          childContainer.innerHTML = "";
        }

        async function displayGeneralSchedule() {
          let first9AMslot = document.createElement("div");

          console.log('display generating');

          const generalScheduleDateInput = document.getElementById("generalScheduleDate");
          const controlPanelArrow = document.getElementById("controlPanelMoveButton");
          controlPanelMoveButton.style.display = "none";

          generalScheduleDateInput.addEventListener("change", () => {
            displayGeneralSchedule();
          });

          const inputDateFieldValue = generalScheduleDateInput.value;
          const inputDateSplit = inputDateFieldValue.split("-");
          const inputYear = inputDateSplit[0];
          const inputMonth = inputDateSplit[1];
          const inputDay = inputDateSplit[2];

          const parentContainer = document.getElementById("parent_container");
          let generalScheduleGrid = "";

          generalScheduleGrid = document.getElementById("generalScheduleGrid");

          if (generalScheduleGrid) {
            generalScheduleGrid.remove();
          }

          generalScheduleGrid = document.createElement("div");
          generalScheduleGrid.classList.add("generalScheduleGridStyle");
          generalScheduleGrid.id = "generalScheduleGrid";

          //One row for the time slots to be displayed
          const rowNumber = teacherSelectorNames.length+1;

          //Since 9-21 == 13 columns + 1 for the teacher names
          const columnNumber = 14;

          generalScheduleGrid.style.gridTemplateRows = `repeat(${rowNumber}, 1fr)s`;
          generalScheduleGrid.style.gridTemplateColumns = `repeat(${columnNumber}, 1fr)`;

          //Adding timeslots first.
          for (let a = 0; a < columnNumber-1; a++) {

            const newTimeslotCell = document.createElement("div");
            newTimeslotCell.classList.add("generalScheduleTimeslotCellStyle");
            newTimeslotCell.style.height = "5vh";

            const newTimeslotTextItem = document.createElement("div");
            newTimeslotTextItem.classList.add("generalScheduleTimeslotTextItem");
            newTimeslotTextItem.textContent = `${a+9}-00`;

            newTimeslotCell.append(newTimeslotTextItem);
      
            if (a == 0) {
              newTimeslotCell.style.gridColumn = "2 / span 1";
            } 

            generalScheduleGrid.append(newTimeslotCell);
          }

          for (let i = 0; i < rowNumber-1; i++) {
            let eventTextNotFound = true;
            const eventTrackingArray = new Array();

            const teacherName = teacherSelectorNames[i];
            const teacherNameCell = document.createElement("div");
            teacherNameCell.classList.add("generalScheduleTeacherCellStyle");
            teacherNameCell.style.gridColumn = 1;
            teacherNameCell.style.height = "5vh";

            const teacherNameTextItem = document.createElement("div");
            teacherNameTextItem.textContent = teacherName;
            teacherNameTextItem.classList.add("generalScheduleTeacherTextItem");
            teacherNameCell.append(teacherNameTextItem);

            generalScheduleGrid.append(teacherNameCell);

            //Attempting to fetch server-side data for the teacher. Recreating it on the client-side if the data is absent.
            let docData = {};

            try {
              const teacherDocRef = doc(schedulesCollection, teacherName);
              const yearMonthDate = `${inputYear}-${inputMonth}`;
              const monthCollection = collection(teacherDocRef, yearMonthDate);
              const dayDocRef = doc(monthCollection, String(inputDay));
              const dayDocSnap = await getDoc(dayDocRef);
              docData = dayDocSnap.data();
              if (!docData) {
                docData = {};
                throw new Error("Document doesn't exist.");
              }
            } catch {

              for (let i = 0; i < columnNumber-1; i++) {
                docData[`${i+9}-00`] = {};
                docData[`${i+9}-00`]["events"] = "";
              }
            }

            const timeslotKeys = Object.keys(docData);



            for (let f = 0; f < timeslotKeys.length; f++) {
              const timeslotKey = timeslotKeys[f];

              if (f == 0 && timeslotKey != "9-00") {
                first9AMslot = document.createElement("div");
                first9AMslot.classList.add("generalScheduleEventCellStyle");
                first9AMslot.style.backgroundColor = "rgb(255,255,255)";

                const newTextItem = document.createElement("div");
                newTextItem.classList.add("generalScheduleEventTextItem");
                newTextItem.textContent = "";
                newTextItem.id = `global_schedule_event_${0}`;

                first9AMslot.append(newTextItem);
                generalScheduleGrid.append(first9AMslot);
              }

              const currentData = docData[timeslotKey];
              let eventsData = currentData["events"];

              if (typeof eventsData == "object") {
                const topic = eventsData["classTopic"];
                const eventType = eventsData["eventType"];
                eventsData = `${eventType} ${topic}`;
              }

              const newEventCell = document.createElement("div");
              newEventCell.classList.add("generalScheduleEventCellStyle");
              newEventCell.id = `global_schedule_event_${f+1}`;

              if (eventsData) {
                eventTextNotFound = false;
              }

              const colorCodesObjectKeys = Object.keys(classColors);

              if (eventsData != "OFF" && eventsData != "") {

                for (let i = 0; i < colorCodesObjectKeys.length; i++) {

                  const colorCodeObjectKey = colorCodesObjectKeys[i];
                  
                  if (eventsData.includes(colorCodeObjectKey)) {

                    const colorCodeValue = classColors[colorCodeObjectKey];
                    newEventCell.style.backgroundColor = colorCodeValue;
                  }
                }

              } else {
                newEventCell.style.backgroundColor = "rgb(255,255,255)";
              }

              const newTextItem = document.createElement("div");
              newTextItem.classList.add("generalScheduleEventTextItem");
              newTextItem.textContent = eventsData;
              newEventCell.append(newTextItem);

              eventTrackingArray.push(newEventCell);

              generalScheduleGrid.append(newEventCell);

            }
            
            if (eventTextNotFound) {
              for (let d = 0; d < eventTrackingArray.length; d++) {
                const curEvent = eventTrackingArray[d];
                curEvent.style.backgroundColor = "#44546a";
              }

              first9AMslot.style.backgroundColor = "#44546a";
            }

          }
          
          const getCurGeneralScheduleGrid = document.getElementById("generalScheduleGrid");
          let gridAppended = true;

          if (!getCurGeneralScheduleGrid) {
            gridAppended = true;
            parentContainer.append(generalScheduleGrid);
          }

        
          if (gridAppended) {
            return true;
          } else {
            return false;
          }
  
        }


        inputDate = setDefaultDate();
        updateInputsAndSelectors(inputDate);
        clearPreviousSchedule();
        const result = await displayGeneralSchedule()

        return new Promise((resolve,reject) => {
          if (result) {
            resolve();
          } else {
            reject();
          }
        });
      }


      //Adding triggers to buttons in the upper menu.
      function addTopBarTriggers () {
        const individualScheduleButton = document.getElementById("individualSchButton");
        const generalScheduleButton = document.getElementById("generalSchButton");
        const templatesButton = document.getElementById("templatesButton");

        let currentlyDisplayedSchedule = "individual";

        individualScheduleButton.addEventListener("click", () => {
          currentlyDisplayedSchedule = "individual";
          chooseLoadSchedule(currentlyDisplayedSchedule);

          individualScheduleButton.style.backgroundColor = "rgb(192, 221, 236)";
        });

        generalScheduleButton.addEventListener("click", () => {
          currentlyDisplayedSchedule = "general";
          chooseLoadSchedule(currentlyDisplayedSchedule);
          generalScheduleButton.style.backgroundColor = "rgb(192, 221, 236)";
        });

        //Set up async to create the blocker element for the duration of the loading.
        templatesButton.addEventListener("click", () => {
          openTemplatesWindow();
        });
      }
      addTopBarTriggers();


      async function openTemplatesWindow() {
        const childContainer = document.getElementById("child_container");
        const parentContainer = document.getElementById("parent_container");

        function cleanPage() {
          const teacherSelector = document.getElementById("teacherSelector");
          const monthSelector = document.getElementById("monthSelector");
          const monthGeneralSelector = document.getElementById("generalScheduleDate");
          const sidePanelButton = document.getElementById("controlPanelMoveButton");
          const childContainer = document.getElementById("child_container");
          const generalSchedule = document.getElementById("generalScheduleGrid");

          if (teacherSelector) teacherSelector.style.display = "none";
          if (monthSelector) monthSelector.style.display = "none";
          if (monthGeneralSelector) monthGeneralSelector.remove();
          if (sidePanelButton) sidePanelButton.style.display = "none";
          if (generalSchedule) generalSchedule.remove();
          if (childContainer) childContainer.style.display = "none";
        }

        async function addNewUI () {
          const check = document.getElementById("templateTeacherSelector");

          if (!check) {
            const teacherSelector = document.createElement("select");
            teacherSelector.classList.add("teacherSelectorTemplate");
            teacherSelector.style.left = "43%";
            teacherSelector.id = "templateTeacherSelector"
            
            for (let i = 0; i < teacherSelectorNames.length; i++) {
              const name = teacherSelectorNames[i];
              const newOption = document.createElement("option");
              newOption.value = name;
              newOption.textContent = name;

              teacherSelector.append(newOption);
            }

            parentContainer.append(teacherSelector);
          } else {
            check.style.display = "";
          }

          const templateContainer = document.createElement("div");
          templateContainer.classList.add("template_container");
          templateContainer.id = "templateContainer";

          const templateSubmitButton = document.createElement("button");
          templateSubmitButton.classList.add("templateSubmitButton");
          templateSubmitButton.textContent = "SUBMIT";
          templateSubmitButton.addEventListener("click", () => {
            console.log('attempting to sumbit the templates');
            addTemplateInfo();
          });

          parentContainer.append(templateSubmitButton);

          const templateEventSelector = document.createElement("select");
          for (let n = 0; n < classesArray.length; n++) {
            const classItem = classesArray[n];
            const newOption = document.createElement("option");
            newOption.value = classItem;
            newOption.textContent = classItem;
            templateEventSelector.append(newOption);
          };

          for (let a = 0; a < 7; a++) {
            const templateWeekcell = document.createElement("div");
            templateWeekcell.classList.add("weekcell");
            templateWeekcell.id = `templateWeekcell${a}`;

            const templateScheduleDayParent = document.createElement("div");
            templateScheduleDayParent.classList.add("schedule_day_parent");
            templateWeekcell.append(templateScheduleDayParent);

            const templateDay = document.createElement("div");
            templateDay.classList.add("day_month_date");
            templateDay.classList.add("textStyleDailyDate");

            let templateDayText = "";

            switch (a) {
              case 0:
                templateDayText = "Monday";
                break;
              case 1:
                templateDayText = "Tuesday";
                break;
              case 2:
                templateDayText = "Wednesday";
                break;
              case 3:
                templateDayText = "Thursday";
                break;
              case 4:
                templateDayText = "Friday";
                break;
              case 5:
                templateDayText = "Saturday";
                break;
              case 6:
                templateDayText = "Sunday";
                break;
              default:
            }

            templateDay.textContent = templateDayText;
            templateScheduleDayParent.append(templateDay);

            for (let b = 0; b < 13; b++) {
              const time = document.createElement("div");
              time.classList.add("schedule_item_time");
              time.classList.add("textStyleTimeSlots");
              const inputTimeText = `${9+b}:00`;
              time.textContent = inputTimeText;

              const event = templateEventSelector.cloneNode(true);
              event.classList.add("schedule_item");
              event.classList.add("textStyleCells");
              event.id = `${a}_template_event_${9+b}`;
              event.value = "";
              event.addEventListener("change", (e) => {
                const classKey = e.target.value;

                if (classKey in classColors) {
                  event.style.backgroundColor = classColors[classKey];
                } else if (classKey.includes("PL")) {
                  event.style.backgroundColor = classColors["PL"];
                } else {
                  event.style.backgroundColor = classColors["_"];
                }

              });

              const room = document.createElement("textarea");
              room.classList.add("schedule_item_room");
              room.classList.add("textStyleTimeSlots");
              room.id = `${a}_template_room_${9+b}`;

              templateScheduleDayParent.append(time);
              templateScheduleDayParent.append(event);
              templateScheduleDayParent.append(room);
            }

            templateContainer.append(templateWeekcell);
          }


          parentContainer.append(templateContainer);
        }

        async function fetchPostTemplateData () {
          const templateTeacherSelector = document.getElementById("templateTeacherSelector");
          const curTeacher = templateTeacherSelector.value;

          const teacherDocRef = doc(schedulesCollection, curTeacher);
          const teacherTemplateCollection = collection(teacherDocRef, "template");
          
          for (let n = 0; n < 7; n++) {
            const teacherTemplateCurDayDocRef = doc(teacherTemplateCollection, `${n}`);
            const teacherTemplateCurDayDocSnap = await getDoc(teacherTemplateCurDayDocRef);

            if (teacherTemplateCurDayDocSnap.exists()) {
              console.log('template exists');

              const teacherTemplateDayData = teacherTemplateCurDayDocSnap.data();
              console.log(teacherTemplateDayData);

              for (let f = 0; f < 13; f++) {
                const curTimeslot = `${f+9}-00`;

                if (curTimeslot in teacherTemplateDayData) {

                  const curTimeslotData = teacherTemplateDayData[curTimeslot];

                  const curRoom = curTimeslotData["room"];
                  let curEventsData = curTimeslotData["events"];

                  if (typeof curEventsData === "object") {
                    const curLesson = curEventsData["eventType"];
                    const curTopic = curEventsData["classTopic"];
                    curEventsData = `${curLesson}`;
                  }

                  const eventToPost = document.getElementById(`${n}_template_event_${9+f}`);
                  if (curEventsData) {
                    if (curEventsData in classColors) {
                      eventToPost.style.backgroundColor = classColors[curEventsData];
                    }
                    eventToPost.value = curEventsData;
                  } else {
                    eventToPost.value = ""
                  }
                  
                  const roomToPost = document.getElementById(`${n}_template_room_${9+f}`);
                  curRoom ? roomToPost.value = curRoom : roomToPost.value = "";

                }
                
              }
            }
          }
          
        }

        async function addTemplateInfo () {

          for (let a = 0; a < 7; a++) {
            const templateTeacherSelector = document.getElementById("templateTeacherSelector");
            const curTeacher = templateTeacherSelector.value;
            const teacherDocRef = doc(schedulesCollection, curTeacher);
            const teacherTemplateCollection = collection(teacherDocRef, "template");
            const teacherTemplateCurDayDocRef = doc(teacherTemplateCollection, `${a}`); 
            const dataToSend = {};

            for (let b = 0; b < 13; b++) {
              const curTime = `${9+b}-00`;
              let curEvent = document.getElementById(`${a}_template_event_${9+b}`).value;

              if (curEvent.includes("BC") || curEvent.includes("IC") || curEvent.includes("AC")) {
                const curEventSplit = curEvent.split(",");
                const eventType = curEventSplit[0];
                const classType = curEventSplit[1];
                curEvent = `${evenType} ${classType}`;
              }

              const curRoom = document.getElementById(`${a}_template_room_${9+b}`).value;

              if ( !(curTime in dataToSend) ) {
                dataToSend[curTime] = {};
              }

              dataToSend[curTime]["room"] = curRoom;
              dataToSend[curTime]["events"] = curEvent;
            }

            console.log(`our object:`);
            console.log(dataToSend);
            await setDoc(teacherTemplateCurDayDocRef, dataToSend, {merge: true});
          }
        } 

        cleanPage();
        addNewUI();
        fetchPostTemplateData();
      }

      function assignTopics () {
        const inputDateS = "";
        const inputDateE = "";

        //Here we will get an object with arrays of dates.
        //...
        //Let's work on assignment topics as we iterate over everything.
      }


      //Attaching control panel to the right side of the screen and generating it.
      function attachELControlPanel() {
        const controlPanelFilterButton = document.getElementById("controlPanelFilterButton");
        const controlPanelEditButton = document.getElementById("controlPanelEditButton");
        const controlPanelTemplateButton = document.getElementById("controlPanelTemplateButton");

        controlPanelEditButton.addEventListener("click", (event) => {
          loadControlPanelWeekcell(1);
        });
        controlPanelFilterButton.addEventListener("click", (event) => {
          loadFilterSelection();
        });
        controlPanelTemplateButton.addEventListener("click", (event) => {
        });

      }
      

      //Adding arrow key responses to update control panel.
      function addKeyboardSelection () {
        document.addEventListener("keydown", (event) => {
          if (controlPanelIsOut == true) {
            if (curWeekceelEditedControlpanel + 7 <= curMonthDays && event.key =="ArrowDown") {
              curWeekceelEditedControlpanel += 7;
              loadControlPanelWeekcell(curWeekceelEditedControlpanel);
            } 

            if (curWeekceelEditedControlpanel - 7 > 0 && event.key=="ArrowUp") {
              curWeekceelEditedControlpanel -= 7;
              loadControlPanelWeekcell(curWeekceelEditedControlpanel);
            }

            if (curWeekceelEditedControlpanel - 1 > 0 && event.key=="ArrowLeft") {
              curWeekceelEditedControlpanel -= 1;
              loadControlPanelWeekcell(curWeekceelEditedControlpanel);
            }

            if (curWeekceelEditedControlpanel + 1 <= curMonthDays && event.key=="ArrowRight") {
              curWeekceelEditedControlpanel += 1;
              loadControlPanelWeekcell(curWeekceelEditedControlpanel);
            }
          }
        });

        return true;
      }

      //Executed when we click a date or use arrow key to navigate inidividual schedule.
      function loadControlPanelWeekcell (editDate) {
        const openedPageDiv = document.getElementById("controlPanelOpenedPage");
        openedPageDiv.innerHTML = '';

        curWeekceelEditedControlpanel = editDate;

        let dataToEdit = 0;
        const eventsNumber = 13;

        if (lastWeekceelEditedControlpanel != 0) {
          lastWeekceelEditedControlpanel.style.filter = '';
        }

        if (editDate in currentSchedule && "10-00" in currentSchedule[editDate]) {
          dataToEdit = currentSchedule[editDate];
        } else {
          //Input the max number of days in this month.
          for (let a = 0; a < daysNumber; a++) {
            currentSchedule[a+1] = {};
            const incrementedEvNum = eventsNumber+9;
            for (let f = 9; f < incrementedEvNum; f++) {
              const currentTimeslotKey = `${f}-00`;
              currentSchedule[a+1][currentTimeslotKey] = {};
              currentSchedule[a+1][currentTimeslotKey]['room'] = '';
              currentSchedule[a+1][currentTimeslotKey]['event'] = '';
            }
          }

          dataToEdit = currentSchedule[editDate];
        }


        for (let i = 9; i < eventsNumber + 9; i++) {
          const currentTimeslotKey = `${i}-00`;
          const currentEventData = dataToEdit[currentTimeslotKey];

          const curRoomValue = currentEventData['room'];
          const curEventValue = currentEventData['event'];

          const newTimeslotCell = document.createElement("input");
          newTimeslotCell.className = "controlPanelOpenedPageEditTimeslot controlPanelPageDisplayType";
          newTimeslotCell.textContent = `${i}:00`;
          newTimeslotCell.value = `${i}:00`;
          newTimeslotCell.readOnly = true;
          newTimeslotCell.id = `${i}_edit_timeslot`;

          openedPageDiv.appendChild(newTimeslotCell);

          const newEventCell = document.createElement("input");
          newEventCell.className = "controlPanelOpenedPageEditEvent controlPanelPageEventDisplayType";
          newEventCell.value = curEventValue;
          newEventCell.textContent = curEventValue;
          newEventCell.id = `${i}_edit_event`;
        
          openedPageDiv.appendChild(newEventCell);

          const newRoomCell = document.createElement("input");
          newRoomCell.className = "controlPanelOpenedPageEditRoom controlPanelPageDisplayType";
          newRoomCell.textContent = curRoomValue;
          newRoomCell.id = `${i}_edit_room`;

          openedPageDiv.appendChild(newRoomCell);

          //setColorCode(newEventCell, curEventValue);
        }

        const submitButton = document.createElement("button");
        submitButton.className = "controlPanelSubmitButton";
        submitButton.textContent = "💾";

        submitButton.addEventListener("click", submitDailyData);

        openedPageDiv.appendChild(submitButton);

        const currentWeekcell = document.getElementById(editDate);
        currentWeekcell.style.filter = 'grayscale(100%)';

        lastWeekceelEditedControlpanel = currentWeekcell;
      }


      async function applyFiltersLoadData() {

        /////////////////////////////////////////////////////////////////////////////
        //Step 1. Unify search conditions and create an object containing all of them.
        /////////////////////////////////////////////////////////////////////////////

        let returnSearchObject;

        let totalDaysCounter = 0;

        /////////////////////////////
        //NOTE: THE FUNCTION BELOW IS BUGGED. IT RETURNS SHORT ARRAYS FOR SOME MONTHS.
        //////////////////////////////


        function createSearchObject(){
          let returnSearchObject = {};

          const startDateFilterInput = document.getElementById("startDateFilterInput");
          const startDateFilterInputValue = startDateFilterInput.value;

          const endDateFilterInput = document.getElementById("endDateFilterInput");
          const endDateFilterInputValue = endDateFilterInput.value;

          let startDateSearchObject = new Date(startDateFilterInputValue);
          let endDateSearchObject = new Date(endDateFilterInputValue);

          const startSearchDayDate = startDateSearchObject.getDate();
          const endSearchDayDate = endDateSearchObject.getDate();

          const startDateMonth = startDateSearchObject.getMonth();
          const endDateMonth = endDateSearchObject.getMonth();

          const startDateYear = startDateSearchObject.getFullYear();
          const endDateYear = endDateSearchObject.getFullYear();

          let curYear = startDateYear;
          let curMonth = startDateMonth;
          let curDate = startSearchDayDate;
          
          let endYear = endDateYear;
          let endMonth = endDateMonth;
          let endDate = endSearchDayDate;

          const testDateObject = new Date();
          testDateObject.setMonth(curMonth + 1);
          testDateObject.setDate(0);
          let firstMonthDays = testDateObject.getDate();

          testDateObject.setMonth(endMonth + 1);
          testDateObject.setDate(0);
          const lastMonthDays = testDateObject.getDate();

          totalDaysCounter = 0;

          if (startDateFilterInputValue == "") {
            startDateSearchObject = new Date();
          }

          if (endDateFilterInputValue == "") {
            endDateSearchObject = new Date();
          }

          //This accounds for both year and month differences since the program is guaranteed to just fail before reaching this point if the years are incorrect.
          const monthDiff = (endDateYear - startDateYear)*12 + (endDateMonth - startDateMonth);

          //We ALWAYS dynamically calculate the duration of the search if the input is there. Formula? endDateSearchObject.getDate() - startDateSearchObject.getDate() within a single month. Iterate over this a number of month that is monthDiff + 1.

          const testCurDateObject = startDateSearchObject;

          //Month diff represents the number of properties in returnSearch object.

          //We just need to know how many days is the difference between start DAY date and end DAY date. That's it. It advances automatically.

          for (let i = 0 ; i < monthDiff+1; i++) {
            curMonth +=1;

            if (i == 0) {

              const key = `${curYear}-${curMonth}`;
              const arrayToSet = [];

              let counterToSet = firstMonthDays;

              if (i+1 == monthDiff +1) {
                counterToSet = endSearchDayDate;
              }

              //We input startSearchDayDate since it shows where to start filter, and endSearchDayDate where to end. They are input values.
              for (let y = startSearchDayDate; y < counterToSet + 1; y++) {
                arrayToSet.push(y); //Since startSearchDayDate is NOT zero-indexed, we add +1 to both counters.
                totalDaysCounter += 1;
              }

              returnSearchObject[key] = [];
              returnSearchObject[key] = arrayToSet;

            } else if (i == monthDiff) {

              const key = `${curYear}-${curMonth}`;
              const arrayToSet = [];

              for (let y = 0; y < endSearchDayDate; y++) {
                arrayToSet.push(y+1);
                totalDaysCounter += 1;
              }

              returnSearchObject[key] = [];
              returnSearchObject[key] = arrayToSet;

            } else {
              const key = `${curYear}-${curMonth}`;
              const arrayToSet = [];

              const testDateInnerObject = new Date();
              testDateInnerObject.setFullYear(curYear);
              testDateInnerObject.setMonth(curMonth);
              testDateInnerObject.setDate(0);
              const thisMonthDays = testDateInnerObject.getDate();

              for (let y = 0; y < thisMonthDays; y++) {
                arrayToSet.push(y+1);
                totalDaysCounter += 1;
              }       
              
              returnSearchObject[key] = [];
              returnSearchObject[key] = arrayToSet;
            }

            //Resetting the month to automatically advance it if we go to the next year.
            testCurDateObject.setMonth(curMonth);
            curYear = testCurDateObject.getFullYear();
            curMonth = testCurDateObject.getMonth();
          }

          return returnSearchObject;
        }

        returnSearchObject = createSearchObject();
        ///Test results///
        ///Search results are correct no matter the input. Works well!

        //Checking if the key is in the "months" of the teacher is useless since we will not always have teachers chosen. Better just create a switch mechanism that loads an empty default page. Also, even this we will not need since the page will be updated and no longer have switches that allow to see another month at all
        
        /////////////////////////////////////////////////////////////////////////////
        //Step 2. Parse the conditions into readable format and load data from the server.
        /////////////////////////////////////////////////////////////////////////////
        async function loadFilteredSchedule () {
          const orderedSchedules = {};

          const childContainer = document.getElementById("child_container");
          childContainer.innerHTML = "";

          let returnSearchObjectKeys = Object.keys(returnSearchObject);
          const schedulescollection = collection(firestore, "schedules");
          let currentTeachers = [];

          //Getting the teacher list to iterate over.
          if (appliedTeacherFilters.length > 0) {
            currentTeachers = appliedTeacherFilters;
          } else {
            currentTeachersRef = doc(schedulescollection, "schedulesUserNames");
            currentTeachersSnap = await getDoc(currentTeachersRef);
            currentTeachersData = currentTeachersSnap.data();
            currentTeachers = currentTeachersData["usernames"];
          }
          

          //Iterating over each teacher. The database structue is Teacher->Month->Dates so we start with teachers.
          for (let i = 0; i < currentTeachers.length; i++) {
            const currentTeacher = currentTeachers[i];
            const teacherDocRef = doc(schedulescollection, currentTeacher);
            const teacherDocSnap = await getDoc(teacherDocRef);
            const teacherDocData = teacherDocSnap.data();
            const teacherDocMonths = teacherDocData["months"];

            //This number decides how many rows the final weekcells in the schedule will have.
            ///////////////////////////////////////////////////////////////////////////
            let maxEventNumber = 0;
            for (const key of returnSearchObjectKeys) {
              const curArray = returnSearchObject[key];
              if (maxEventNumber < curArray.length) {
                maxEventNumber = curArray.length;
              }
            }
            /////////////////////////////////////////////////////////////////////////
            /////////////////////////////////////////////////////////////////////


            /////////////////////////////////////////////////////////////////////
            //Here we fetch the data for each teacher.
            /////////////////////////////////////////////////////////////////////
            async function fetchData () {
                const monthKeys = Object.keys(returnSearchObject);

                ///We iterate over each month within each teacher. No unnecessary operations, as database requires.
                for (const key of monthKeys) {
                  const monthCollectionRef = collection(teacherDocRef, key);
                  const currentDatesArray = returnSearchObject[key];

                  orderedSchedules[key] = orderedSchedules[key] || {};

                  for (let x = 0; x < currentDatesArray.length; x++){
                    const currentDate = currentDatesArray[x];

                    orderedSchedules[key][currentDate] = orderedSchedules[key][currentDate] || {};

                    const stringDate = String(currentDate);
                    const dateDocRef = doc(monthCollectionRef, stringDate);
                    const dateDocSnap = await getDoc(dateDocRef);
                    const dateDocData = dateDocSnap.data();

                    let dateDocDataKeys = Object.keys(dateDocData || {});
                    
                    //Next, we will have to add timeslots 9-00 through 2100 as keys.
                    for (let f = 0; f < dateDocDataKeys.length; f++) {
                      const docKey = dateDocDataKeys[f];
                      const timeslotData = dateDocData[docKey];

                      orderedSchedules[key][currentDate][`${docKey}-${currentTeacher}`] = timeslotData;
                    }
                  }

                }
            }

            await fetchData();

          }

          async function postFilteredSchedules() {
            const generatedColors = {};

            const orderedSchedulesKeys = Object.keys(orderedSchedules);
            const parentContainer = document.getElementById("parent_container");
            const lineHeight = 4;
            const baseHeightMutliplier = lineHeight*13;
            const totalWeekcellRowNumber = Math.ceil(totalDaysCounter/7);
            const parentContainerHeight = baseHeightMutliplier*totalWeekcellRowNumber;
            childContainer.style.height = `fit-content`;
            childContainer.style.gridTemplateRows = `repeat(${totalWeekcellRowNumber}, 1fr)`;

            let maxEventsDisplayWeekcell = appliedTeacherFilters.length*13;

            //First step. Getting into each month.
            for (const ordKey of orderedSchedulesKeys) {
              const curMonthSchedule = orderedSchedules[ordKey];

              const unsplitKey = ordKey.split("-");
              const scheduleDateYear = unsplitKey[0];
              const scheduleDateMonth = unsplitKey[1];

              const curScheduleDate = `${scheduleDateYear}/${scheduleDateMonth}`;
              const ordDateKeys = Object.keys(curMonthSchedule);
              //The second step. Getting into the days.
              for (const ordDateKey of ordDateKeys) {
                const curDateSchedule = curMonthSchedule[ordDateKey];
                let ordTimeslotKeys = Object.keys(curDateSchedule);

                const displayWeekcell = document.createElement("div");
                displayWeekcell.className = "filteredWeekcell";

                let rowsDisplayWeekcell = maxEventsDisplayWeekcell;

                displayWeekcell.style.gridTemplateRows = `repeat(${rowsDisplayWeekcell + 1}, 1fr)`;
                childContainer.appendChild(displayWeekcell);

                const curDateDisplayDateDiv = document.createElement("div");
                const displayDate = `${scheduleDateYear}/${scheduleDateMonth}/${ordDateKey}`;
                curDateDisplayDateDiv.className = "filteredWeekcellDate";
                curDateDisplayDateDiv.textContent = displayDate;

                displayWeekcell.appendChild(curDateDisplayDateDiv);

                if (ordTimeslotKeys.length === 0) {
                  ordTimeslotKeys = new Array(13);
                } else {
                  ordTimeslotKeys = ordTimeslotKeys.sort((a, b) => {
                    const hourA = a.split("-")[0];
                    const hourB = b.split("-")[0];

                    return hourA - hourB;
                  });
                }

                for (let f = 0; f < ordTimeslotKeys.length; f++) {
                  const displayTimeslotDiv = document.createElement("div");
                  const teacherShortDiv = document.createElement("div");
                  const displayEventTypeDiv = document.createElement("div");

                  displayEventTypeDiv.id = `displayEventFilter_${f}`;
                  teacherShortDiv.id = `displayTeacherShortFilter_${f}`;

                  const ordTimeslotKey = ordTimeslotKeys[f];
                  const curTimeslotData = curDateSchedule[ordTimeslotKey];

                  let timeslotSplit = 0;
                  let timeslotToPost = '';
                  let timeslotDataPost = '';

                  let teacher = '';
                  let teacherFirstLetter = '';

                  if (!ordTimeslotKey) {
                    timeslotToPost = `${9+f}-00`;
                    timeslotDataPost = '';
                  } else {
                    timeslotSplit = ordTimeslotKey.split("-");

                    const hour = timeslotSplit[0];
                    const minutes = timeslotSplit[1];
                    teacher = timeslotSplit[2];
                    teacherFirstLetter = teacher[0];

                    timeslotToPost = `${hour}-${minutes}`;
                    timeslotDataPost = curTimeslotData["events"];

                    if (timeslotDataPost instanceof Object) {
                      const timeslotDataPostTopic = timeslotDataPost["classTopic"];
                      const timeslotDataPostClassN = timeslotDataPost["eventType"];
                      timeslotDataPost = `${timeslotDataPostClassN} ${timeslotDataPostTopic}`;
                    }
                  }

                  teacherShortDiv.addEventListener("mouseenter", () => {
                    teacherShortDiv.classList.add("filteredWeekcellTeacherLong");
                    teacherShortDiv.textContent = teacher;
                  });

                  teacherShortDiv.addEventListener("mouseleave", () => {
                    teacherShortDiv.classList.remove("filteredWeekcellTeacherLong");
                    teacherShortDiv.textContent = teacherFirstLetter;
                  });

                  displayTimeslotDiv.textContent = timeslotToPost;
                  teacherShortDiv.textContent = teacherFirstLetter;
                  displayEventTypeDiv.textContent = timeslotDataPost;


                  if (appliedEventFilters.length > 0) {
                    if (appliedEventFilters.includes(timeslotDataPost)) {
                      displayWeekcell.appendChild(displayTimeslotDiv);
                      displayWeekcell.appendChild(teacherShortDiv);
                      displayWeekcell.appendChild(displayEventTypeDiv);
                    } 
                  } else {
                    displayWeekcell.appendChild(displayTimeslotDiv);
                    displayWeekcell.appendChild(teacherShortDiv);
                    displayWeekcell.appendChild(displayEventTypeDiv);
                  }

                 //calculateDivSymbolNumber(`displayEventFilter_${f}`, 6);

                  if (timeslotDataPost.length > eventMaxSymbolCount) {
                    displayEventTypeDiv.classList.add("filteredWeekcellEventHover");
                    displayEventTypeDiv.style.justifyContent = "left";
                  }


                  displayTimeslotDiv.className = "filteredWeekcellTimeslot";
                  teacherShortDiv.className = "filteredWeekcellTeacherShort";
                  displayEventTypeDiv.className = "filteredWeekcellEvent";


                  const filterColorsDocRef = doc(schedulesCollection, "filterColors");
                  const filterColorsDocSnap = await getDoc(filterColorsDocRef);
                  const filterColorsDocData = filterColorsDocSnap.data();

                  for (let i = 0; i < teacherSelectorNames.length; i++) {
                    const curTeacher = teacherSelectorNames[i];
                    filterColorsObject[curTeacher] = "#000000";
                  }

                  //If the object exists, assign it to the object on the client side that will be modified.
                  if (filterColorsDocSnap.exists()) {
                    const colorsData = filterColorsDocSnap.data();
                    Object.assign(filterColorsObject, colorsData);
                  }

                  let colorValue = filterColorsObject[teacher];
                  teacherShortDiv.style.backgroundColor = `${colorValue}`;
                }
              }
            }
          }

          postFilteredSchedules();
        }

        loadFilteredSchedule();
      }

      function addFilter (value, filterType) {
        if (!appliedEventFilters.includes(value) && !appliedTeacherFilters.includes(value)) {
          const teacherFiltersParent = document.getElementById("teacherFiltersParent");

          curFiltersAppliedCounter +=1;
          
          if (curFiltersAppliedCounter > curFiltersFieldMaxRows) {
            curFiltersFieldMaxRows +=1;
            teacherFiltersParent.style.gridTemplateRows = curFiltersFieldMaxRows;
          }

          const newFilterElement = document.createElement("div");
          newFilterElement.className = "controlPanelFilterItem"

          const newFilterElementText = document.createElement("div");
          newFilterElementText.className = "controlPanelFilterItemText";
          newFilterElementText.textContent = value;

          const newFilterElementRemoveButton = document.createElement("button");
          newFilterElementRemoveButton.className = "controlPanelFilterItemRemoveButton";
          newFilterElementRemoveButton.textContent = "❌";


          newFilterElement.append(newFilterElementText);
          newFilterElement.append(newFilterElementRemoveButton);

          teacherFiltersParent.append(newFilterElement);


          if (filterType == "teacher") {
            appliedTeacherFilters.push(value);
          } else if (filterType = "event") {
            appliedEventFilters.push(value);
          }

          newFilterElementRemoveButton.addEventListener("click", () => {
            newFilterElement.remove();

            let valueToClear = newFilterElement.textContent;
            valueToClear = valueToClear.slice(0, -1);

            if (filterType == "teacher") {

              appliedTeacherFilters = appliedTeacherFilters.filter(value => value != valueToClear);
            } else if (filterType == "event") {
              appliedEventFilters = appliedEventFilters.filter(value => value != valueToClear);
            }

            if (curFiltersAppliedCounter > 0) {
              curFiltersAppliedCounter -= 1;
            }

          });

        }
      }

      async function colorPickerCreate () {

        const colorPickerField = document.createElement("div");
        colorPickerField.className = "colorPickerField";
        colorPickerField.id = "colorPickerID";

        const exitButton = document.createElement("button");
        exitButton.className = "colorPickerExitButton";
        exitButton.textContent = "X";

        const teacherPicker = document.createElement("select");
        teacherPicker.className = "colorPickerTeacherPicker";

        for (const name of teacherSelectorNames) {
          const nameOption = document.createElement("option");
          nameOption.value = name;
          nameOption.textContent = name;

          teacherPicker.append(nameOption);
        }

        const colorPickerWheel = document.createElement("input");
        colorPickerWheel.type = "color";
        colorPickerWheel.className = "colorPickerColorWheel";

        const colorPickerSubmitButton = document.createElement("button");
        colorPickerSubmitButton.className = "colorPickerSubmitButton";
        colorPickerSubmitButton.textContent = "CHANGE";

        colorPickerField.append(exitButton);
        colorPickerField.append(teacherPicker);
        colorPickerField.append(colorPickerWheel);
        colorPickerField.append(colorPickerSubmitButton);

        const childContainer = document.getElementById("child_container");
        childContainer.append(colorPickerField);

        const filterColorsDocRef = doc(schedulesCollection, "filterColors");
        const filterColorsDocSnap = await getDoc(filterColorsDocRef);

        for (let i = 0; i < teacherSelectorNames.length; i++) {
          const teacher = teacherSelectorNames[i];
          filterColorsObject[teacher] = "#000000";
        }

        //If the object exists, assign it to the object on the client side that will be modified.
        if (filterColorsDocSnap.exists()) {
          const colorsData = filterColorsDocSnap.data();
          Object.assign(filterColorsObject, colorsData);

          colorPickerWheel.value = filterColorsObject[teacherSelectorNames[0]];
        }

        //Changes the color based on the teacher name.
        teacherPicker.addEventListener("change", () => {
          const teacher = teacherPicker.value;
          colorPickerWheel.value = filterColorsObject[teacher];
        });

        colorPickerField.addEventListener("change", () => {
          const color = colorPickerWheel.value;
          const teacher = teacherPicker.value;
          filterColorsObject[teacher] = color;
        });

        exitButton.addEventListener("click", () => {
          colorPickerField.remove();
        });

        colorPickerSubmitButton.addEventListener("click", () => {
          const colorValue = colorPickerWheel.value;
          const currentTeacher = teacherPicker.value;
          colorPickerSubmit(colorValue, currentTeacher);
        });
      }


      async function colorPickerSubmit(color, teacher){
        const filterColorsDocRef = doc(schedulesCollection, "filterColors");
        const sendColorObj = {[teacher]: color};
        await setDoc(filterColorsDocRef, sendColorObj, {merge: true});
      }

      async function loadFilterSelection() {
        const openedPageDiv = document.getElementById("controlPanelOpenedPage");
        openedPageDiv.innerHTML = '';

        appliedEventFilters = [];
        appliedTeacherFilters = [];

        const startDateInputLabel = document.createElement("div");
        startDateInputLabel.className = "filterLabelStyle";
        startDateInputLabel.textContent = "S";
        const teacherFilterSelector = document.createElement("select");
        teacherFilterSelector.className = "teacherFilterSelector filtersSelectorsDisplayStyle";


        const endDateInputLabel = document.createElement("div");
        endDateInputLabel.className = "filterLabelStyle";
        endDateInputLabel.textContent = "E";
        const eventFilterSelector = document.createElement("select");
        eventFilterSelector.className = "eventFilterSelector filtersSelectorsDisplayStyle";


        const startDateFilterInput = document.createElement("input");
        startDateFilterInput.className = "startDateFilterInput filtersDatesDisplayStyle";
        startDateFilterInput.type="date";
        startDateFilterInput.id = "startDateFilterInput";

        const endDateFilterInput = document.createElement("input");
        endDateFilterInput.className = "endDateFilterInput filtersDatesDisplayStyle";
        endDateFilterInput.type="date";
        endDateFilterInput.id = "endDateFilterInput";



        const teacherFiltersParent = document.createElement("div");
        teacherFiltersParent.className = "controlPanelFiltersField";
        teacherFiltersParent.id = "teacherFiltersParent";
        
        const colorPickerButton = document.createElement("button");
        colorPickerButton.className = "controlPanelFiltersColorPickerButton";
        colorPickerButton.textContent = "COLOR PICKER";

        const submitButton = document.createElement("button");
        submitButton.className = "controlPanelFiltersSubmitButton";
        submitButton.textContent = "💾";
        
        openedPageDiv.append(startDateInputLabel);
        openedPageDiv.append(startDateFilterInput);
        openedPageDiv.append(teacherFilterSelector);

        
        openedPageDiv.append(endDateInputLabel);
        openedPageDiv.append(endDateFilterInput);
        openedPageDiv.append(eventFilterSelector);

        openedPageDiv.append(teacherFiltersParent);
        openedPageDiv.append(colorPickerButton);
        openedPageDiv.append(submitButton);



        const defaultTeacherSelector = document.createElement("option");
        defaultTeacherSelector.disabled = true;
        defaultTeacherSelector.textContent = "Choose a teacher";
        defaultTeacherSelector.value = "";
        defaultTeacherSelector.style.textAlign = "center";

        teacherFilterSelector.append(defaultTeacherSelector);

        for (const name of teacherSelectorNames) {
          const newOption = document.createElement("option");
          newOption.value = name;
          newOption.textContent = name;
          newOption.style.textAlign = "center";

          teacherFilterSelector.append(newOption);
        }
        teacherFilterSelector.value = "";


        const defaultEventSelector = document.createElement("option");
        defaultEventSelector.disabled = true;
        defaultEventSelector.textContent = "Choose an event";
        defaultEventSelector.value = "";
        defaultEventSelector.style.textAlign = "center";

        eventFilterSelector.append(defaultEventSelector);

        for (const curClass of classesArray) {
          const newOption = document.createElement("option");
          newOption.value = curClass;
          newOption.textContent = curClass;
          newOption.style.textAlign = "center";

          eventFilterSelector.append(newOption);
        }
        eventFilterSelector.value = "";

        colorPickerButton.addEventListener("click", colorPickerCreate);
        submitButton.addEventListener("click", applyFiltersLoadData);

        eventFilterSelector.addEventListener("change", (event) => {
          const value = event.target.value;
          const filterType = "event";
          addFilter(value, filterType);
        });

        teacherFilterSelector.addEventListener("change", (event) => {
          const value = event.target.value;
          const filterType = "teacher";
          addFilter(value, filterType);
        });
      }

      async function submitDailyData () {
        const monthSelector = document.getElementById("monthSelector");
        const teacherSelector = document.getElementById("teacherSelector");

        const monthSelectorValue = monthSelector.value;
        const teacherSelectorValue = teacherSelector.value;

        const schedulesCollectionRef = collection(firestore,"schedules");
        const teacherColletionRef = doc(schedulesCollectionRef, teacherSelectorValue);
        const curMonthCollection = collection(teacherColletionRef, monthSelectorValue);

        const curDayDoc = doc(curMonthCollection, `${curWeekceelEditedControlpanel}`);
        const snap = await getDoc(curDayDoc);
        const data = snap.data();

        let dataToSend = {};

        function gatherEditedData() {
          //Index starts from nine to allow for easier data allocation. 

          const eventNumber = 13;

          for (let i = 9; i < 9 + eventNumber; i++) {
            const timeCell = document.getElementById(`${i}_edit_timeslot`);
            const eventCell = document.getElementById(`${i}_edit_event`);
            const roomCell = document.getElementById(`${i}_edit_room`);

            const eventCellValue = eventCell.value;
            const roomCellValue = roomCell.value;

            const updateCellEvent = document.getElementById(`${curWeekceelEditedControlpanel}_event_${i-9}`);
            const updateCellRoom = document.getElementById(`${curWeekceelEditedControlpanel}_room_${i+1}`);

            updateCellEvent.textContent = eventCellValue;
            updateCellRoom.textContent = roomCellValue;

            let timeCellValue = timeCell.value;
            timeCellValue = timeCellValue.replace(":","-");

            dataToSend[timeCellValue] = {};
            dataToSend[timeCellValue]['room'] = roomCellValue;

            const splitEventValue = eventCellValue.split(" ");
            let className = '';
            let topic = '';

            if (splitEventValue.length > 1) {
              className = splitEventValue[0];
              topic = splitEventValue[1];
            } else {
              className = splitEventValue[0];
            }

            if (className == "BC" || "IC" || "AC") {
              dataToSend[timeCellValue]["events"] = {};
              dataToSend[timeCellValue]["events"]["classTopic"] = topic;
              dataToSend[timeCellValue]["events"]["eventType"] = className;

              console.log('class name is a conversation class');
            } else {
              dataToSend[timeCellValue]["events"] = eventCellValue;
              console.log('class name is anything else')
            }
          }
        }

        gatherEditedData();


        await setDoc(curDayDoc, dataToSend, {merge: true});
      }

      function controlPanelInOut(event) {
        const controlPanel = document.getElementById("controlPanelMain");
        const parentContainer = document.getElementById("parent_container");
        
        if (!controlPanelIsOut && !controlPanelCalledFieldClick) {
          controlPanel.style.left = '0vw';
          controlPanel.style.transition = 'left 2s ease';

          controlPanelMoveButton.style.left = '30vw';
          controlPanelMoveButton.style.transition = 'left 2s ease';

          parentContainer.style.transform = 'scaleX(0.7)';
          parentContainer.style.transition = 'transform 2s ease';
          parentContainer.style.transformOrigin = '100%';

          controlPanelCalledFieldClick = false;
          controlPanelIsOut = true;

          loadControlPanelWeekcell(1);

        } else if (controlPanelIsOut || controlPanelCalledFieldClick) {
          const parentContainer = document.getElementById("parent_container");

          controlPanel.style.left = '-30vw';
          controlPanel.style.transition = 'left 2s ease';

          controlPanelMoveButton.style.left = '0vw';
          controlPanelMoveButton.style.transition = 'left 2s ease';

          parentContainer.style.transform = 'scaleX(1)';
          parentContainer.style.transition = 'transform 2s ease';
          parentContainer.style.transformOrigin = '100%';

          controlPanelCalledFieldClick = false;
          controlPanelIsOut = false;

          if (lastWeekceelEditedControlpanel != 0) {
            lastWeekceelEditedControlpanel.style.filter = '';
          }
        }
      }

      function controlPanelOut(event) {
        const controlPanel = document.getElementById("controlPanelMain");
        const parentContainer = document.getElementById("parent_container");

        const divID = event.target.id;
        let dateToEditor = '';

        const firstChar = divID.charAt(0);
        const secondChar = divID.charAt(1);

        const stringToCheck = `${firstChar}${secondChar}`;
        const stringToNumber = Number(stringToCheck);

        if (!isNaN(stringToNumber)) {
          dateToEditor = stringToCheck;
        } else {
          dateToEditor = firstChar;
        }
        
        if (!controlPanelIsOut) {
          controlPanel.style.left = '0vw';
          controlPanel.style.transition = 'left 2s ease';

          controlPanelMoveButton.style.left = '30vw';
          controlPanelMoveButton.style.transition = 'left 2s ease';

          parentContainer.style.transform = 'scaleX(0.7)';
          parentContainer.style.transition = 'transform 2s ease';
          parentContainer.style.transformOrigin = '100%';

          controlPanelCalledFieldClick = true;
          controlPanelIsOut = true;
          loadControlPanelWeekcell(dateToEditor);

          if (lastWeekceelEditedControlpanel != 0) {
            lastWeekceelEditedControlpanel.style.filter = '';
          }

        } else {
          loadControlPanelWeekcell(dateToEditor);
        }
      }

      controlPanelMoveButton.addEventListener("click", controlPanelInOut);

        /*
        <div class = "weekcells" id = "w1d1">
          <div class = "schedule_day_parent">
            <div class = "day_month_date textStyleDailyDate"></div>

            <div class = "schedule_item_time textStyleTimeSlots"></div>
            <div class = "schedule_item textStyleCells"></div>
            <div class = "schedule_item_room textStyleTimeSlots"></div>

          </div>
        </div>*/

      function getDaysNumber(y, m) {
        if (m == 11) {
          m = 0;
          y += 1;
        } else {
          m += 1;
        }

        const numDays = new Date(y, m, 0).getDate(); //Since it grabs the number of days in the previous month, we set m to m+1.
        curMonthDays = numDays;
        return numDays;
      }

      function findStartingCell (date) {
        let weekDay = date.getDay();

        if (weekDay == 0) {
          weekDay = 7;
        }
        
        return weekDay;
      }


      function calculateDivSymbolNumber (input_id, differential) {
        const exDiv = document.getElementById(input_id);
        const rect = exDiv.getBoundingClientRect();
        const divWidth = rect.width;

        const computedStyle = window.getComputedStyle(exDiv);
        const fontSize = parseFloat(computedStyle.fontSize);
        
        const averageCharWidth = fontSize * 0.5;
        const fittingCharacters = Math.floor(divWidth/averageCharWidth);
        
        eventMaxSymbolCount = fittingCharacters - differential;
      }

      function setColorCode(div, eventData) {
        let innerText = div.textContent;
        let textItems = innerText.split(' ');

        for (let i = 0; i < colorCodesClassNames.length; i++) {
          for (const textItem of textItems) {
            if (textItem == colorCodesClassNames[i]) {
              const curColor = colorCodes[i];
              div.style.backgroundColor = curColor;
            };
          }
        }
      }

      async function fillInDates(documentIn){
        const documentDataObject = documentIn.data();
        const documentDataObjectKeys = Object.keys(documentDataObject);

        const curDate = documentIn.id;
        
        currentSchedule[curDate] = {};

        const docData = documentIn.data();
        const timeSlotsKeys = Object.keys(docData);

        let timeSlotsStart = 1;

        if (timeSlotsKeys.includes("9-00")) {
          timeSlotsStart = 0;
        } else {
          currentSchedule[curDate]["9-00"] = {};
          currentSchedule[curDate]["9-00"]["room"] = "";
          currentSchedule[curDate]["9-00"]["edit"] = "";
          currentSchedule[curDate]["9-00"]["event"] = "";
        }

        for (let i = 9; i < timeSlotsKeys.length + 9; i++) {
          const curTimeslotKey = timeSlotsKeys[i-9];
          currentSchedule[curDate][`${timeSlotsStart+i}-00`] = {};

          const curEventDiv = document.getElementById(`${curDate}_event_${timeSlotsStart+i-9}`);
          const scheduleDayParent = document.getElementById(`${curDate}`);
          let rowsMax = 14;

          curEventDiv.style.backgroundColor = "#b3fcfa";

          const curTimeSlotData = docData[`${timeSlotsStart+i}-00`];
          const eventData = curTimeSlotData["events"];

          const room = curTimeSlotData["room"];
          currentSchedule[curDate][`${timeSlotsStart+i}-00`]["room"] = room;
      
          if (typeof eventData === 'object' && eventData !== null) {
            const eventClassName = eventData['eventType'];
            const eventTopicNumber = eventData['classTopic'];
            const displayValue = `${eventClassName} ${eventTopicNumber}`;

            currentSchedule[curDate][`${timeSlotsStart+i}-00`]["event"] = displayValue;

            curEventDiv.textContent = displayValue;
          } else {
            currentSchedule[curDate][`${timeSlotsStart+i}-00`]["event"] = eventData;

            if (eventData.length > eventMaxSymbolCount) {
              curEventDiv.classList.add("schedule_item_scale_hover");
              curEventDiv.textContent = eventData;
              curEventDiv.style.justifyContent = "left";
            } else {
              curEventDiv.textContent = eventData;
            }
          }

          setColorCode(curEventDiv, eventData);
        }
      }

      async function loadNewMonth () {
        controlPanelIsOut = true;
        controlPanelInOut();

        const monthSelectorValue = monthSelector.value;
        const teacherSelectorValue = teacherSelector.value;
        const teacherDocRef = doc(schedulesCollection, teacherSelectorValue);
        const teacherDocSnap = await getDoc(teacherDocRef);
        const teacherDocData = teacherDocSnap.data();

        const dateDaysDate = new Date(monthSelectorValue);
        dateDaysDate.setDate(1);
        const yearSet = dateDaysDate.getFullYear();
        const month = dateDaysDate.getMonth();

        curMonthDays = getDaysNumber(yearSet,month);

        const months = teacherDocData["months"];

        if (months.includes(monthSelectorValue)) {

          const newMonthColectionRef = collection(teacherDocRef, monthSelectorValue);

          const monthSelectorValueSplit = monthSelectorValue.split("-");
          const year = monthSelectorValueSplit[0];
          const curMonth = monthSelectorValueSplit[1];

          const startingCellDate = new Date()
          startingCellDate.setMonth(curMonth); //We account for different indexes by ignoring them since setDate 0 with getDate returns the last day (number of days) in the previous month.
          startingCellDate.setYear(year);
          startingCellDate.setDate(0);

          const numberOfDays = startingCellDate.getDate();

          const checkDate = new Date();
          checkDate.setYear(year);
          checkDate.setMonth(curMonth-1);
          checkDate.setDate(1);
          const startingCell = findStartingCell(checkDate);

          const monthDocsSnap = await getDocs(newMonthColectionRef);

          createWeekcells(numberOfDays,startingCell,checkDate);

          for (const document of monthDocsSnap.docs) {
            fillInDates(document);
          }
          
        } else {
          generateAndDisplayNewMonth(monthSelectorValue, teacherSelectorValue);
        }
      }

      async function postSchedule(userUID, inputTeacher = "AKITO", inputMonth = new Date()) {
        const currentYear = inputMonth.getFullYear();
        const currentMonth = inputMonth.getMonth()+1;

        inputMonth = `${currentYear}-${currentMonth}`;

        if (userUID) {
          const usersCollection = collection(firestore, "users");
          const teacherSelector = document.getElementById("teacherSelector");
          
          const userUIDocRef = doc(usersCollection, `${userUID}`);

          const docSnap = await getDoc(userUIDocRef);
          const docData = docSnap.data();
          const lastOpenedSchedule = docData["last_opened_schedule"];

          if (lastOpenedSchedule) {
            inputTeacher = lastOpenedSchedule;
            teacherSelector.value = inputTeacher;
          }
        } 

        const teacherDocRef = doc(schedulesCollection, inputTeacher);

        const docSnap = await getDoc(teacherDocRef);
        const docData = docSnap.data();
        const months = docData['months'];

        if (!months.includes(inputMonth)) {
          loadNewMonth();
        } else {
          const monthCollectionRef = collection(teacherDocRef, inputMonth);
          const docsSnap = await getDocs(monthCollectionRef);

          for (const document of docsSnap.docs) {
            fillInDates(document);
          }
          
        }

      }
</html>
