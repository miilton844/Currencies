(function () {

    $(function () {
        //Global 
        let URL = "https://api.coingecko.com/api/v3";
        let URLForGraphStart = "https://min-api.cryptocompare.com/data/pricemulti?fsyms="
        let URLForGraphEnd = "&tsyms=USD";

        //This query string is used for the main URL 
        let allCoinsQueryString = "/coins"
        //This query string is used for the more info search
        let moreInfoQueryString = "/coins";

        // creating a More Info Cache to optimize results of more info search
        let moreInfoCache = new Map();
        // Creating a map where the keys are the symbol of the coin in order to optimize the search (O(1)) of a coin  beyond the 100 coins cap//Coins Cache
        // no need to update this array because we download only once the main array in the initialization, this is critical when we have a high amout of 
        // coins such as in the alternative URL
        let coinsMapWithSymbolAsId = new Map();
        // Creating a map where the keys are the Id for of the coin in order to optimize the search (O(1)) for the live report Array beyond the 100 coins cap, 
        // no need to update this array because we download only once the main array in the initialization,, this is critical when we have a high amout of
        //  coins suca as in the alternative URL
        let coinsMapWithIdAsID = new Map();
        // Creating a simple live report array because we have up to 6 coins in this array (O(1))
        let liveReportsArray = [];
        // creating a global variable for the graph interval in order to cancel it whenever needed
        let graphInterval;

        // Initalization of project 
        init();

        // functions that initalizes the project when we upoad the page
        function init() {
            var contentForLoadingDiv = "Loading"
            // a function that shows the loading div
            showLoadingDiv(contentForLoadingDiv)
            // a function that gets coins from the URL and presents them
            getCoinsFromUrl(URL, allCoinsQueryString);

        }

        // Events functions created when clicking on relevant buttons

        $("#homeButton").click(function () {
            //Resetting all elements on the user interaface
            UIReset();
            // a function that creates the card elements on page with the relevant details
            showCoinsOnUI();
            // a function that updates the relevant coins toggle to ON
            updateCoinsOnUIAfterCLicks(liveReportsArray, "on", true);
            // Resetting the search input value
            $("#searchInputValue").val("");
        })

        $("#aboutButton").click(function () {
            //Resetting all elements on the user interaface
            UIReset();
            // a function that creates the card elements on page with the relevant details
            showAboutInfoOnUI();
            // Resetting the search input value
            $("#searchInputValue").val("");
        })

        $("#liveReportsButton").click(function () {
            //If after clicking the button the live reports array is not empty then we show the coins value information on the UI with a graph
            if (liveReportsArray.length != 0) {
                //Resetting all elements on the user interaface
                UIReset();
                // Resetting the search input value
                $("#searchInputValue").val("");
                // creating the options variable for the graph and also coins query string for the URL which we will use to download the data
                let coinsQueryString = "";
                let options = optionsCreationForGraph();
                options.data = [];
                let coinQueryStringWithoutLastChar = updateCoinsQueryStringForLiveReport(coinsQueryString);
                //Calling the function which gets the data and show it in a graph on the UI
                showGraphOnUIAfterDownloadingInfo(URLForGraphStart, URLForGraphEnd, coinQueryStringWithoutLastChar, options);
            } else {
                alert("You must choose at least one coin to show on the graph");
            }
        })

        $("#resetButton").click(function () {
            //Resetting all elements on the user interaface
            UIReset();
            //Resetting the live reports array
            liveReportsArray = [];
            // showing all the coins on the UI
            showCoinsOnUI();
            //resetting the search input value
            $("#searchInputValue").val("");
            console.log(liveReportsArray);
        })


        $("#searchButton").click(function () {
            //Resetting all elements on the user interaface
            UIReset();
            //Getting the value in the search Input and modifying it for search ( Trimming and putting it in lower case for search)
            let searchInputValue = $("#searchInputValue").val();
            let searchInputValueValidForSearch = searchInputValueModifications(searchInputValue);
            searchAndDisplayCoin(searchInputValueValidForSearch);
        })


        $("#coinsContainer").on('click', '.moreInfoButton', function (event) {
            let currentCurrencyId = event.target.id;
            let ariaExpandedValue = $("#" + currentCurrencyId)[0].getAttribute("aria-expanded");
            // We call for more information only if the button doesnt have aria expanded attribute
            if (ariaExpandedValue === "false" || ariaExpandedValue === null) {
                let currentCoinQueryString = "/" + currentCurrencyId;
                var content = $("#" + currentCurrencyId).next();
                //Getting more info for the currency and displaying it 
                getMoreInfoForCurrencyAndDisplay(URL, moreInfoQueryString, currentCoinQueryString, content, currentCurrencyId)
            }
        });

        $("#coinsContainer").on('click', '.slider', function (event) {
            let sliderElement = $("#" + event.target.id);
            let id = event.target.id.slice(6, event.target.id.length);
            console.log(liveReportsArray);

            // if the status should be on , then we update it and add the coins info to the liver reports array and check if the modal should pop up
            if (sliderElement.attr("status") == "off") {
                sliderElement.attr("status", "on");
                addingCoinToLiveReportsArray(id);
                validationForModalPopUp();
            } else {
                // if the status should be off then we update it and delete the coin info from the live reports array
                deleteLiveReportsArray(id);
                sliderElement.attr("status", "off")
                console.log(liveReportsArray)
            }
        });


        //View functions

        // Home page and search section


        // display coins on UI 
        //please notice that because were using a map, and we save coins by a symbol to optimize the search in the search coins section
        // then sometimes two coins might have the same symbol, if thats so when we run on the map keys we first of all identify
        // if we have an array: if its true then  we display all the coins of the same symbol and then move to the next key 
        // if its not true then we simply display the coin of the value and move to the next key of the map 

        function showCoinsOnUI() {
            console.log(coinsMapWithSymbolAsId)
            for (const [key, value] of coinsMapWithSymbolAsId.entries()) {
                if (!Array.isArray(value)) {
                    let id = value.id;
                    let symbol = value.symbol.toUpperCase();
                    let name = value.name;
                    showElementsOnUI(id, symbol, name)
                } else {
                    for (i = 0; i < value.length; i++) {
                        let id = value[i].id;
                        let symbol = value[i].symbol.toUpperCase();
                        let name = value[i].name;
                        showElementsOnUI(id, symbol, name)
                    }
                }
            }
        }

        // construct and display elements with information on UI
        function showElementsOnUI(id, symbol, name) {
            let newDivCard = addingNewDivCard();
            let newDivCardBody = addingNewDivCardBody(newDivCard);
            let headerDivCard = addingHeaderDivCard(newDivCardBody);
            addingHeaderSymbol(headerDivCard, symbol);
            let toggleLabel = addingToggleLabel();
            let checkBoxInput = addingcheckBoxInput();
            let sliderSpan = addingSliderSpan(id)
            AddingToggleLabelToHeaderDivCard(headerDivCard, toggleLabel, checkBoxInput, sliderSpan);
            addingHeaderNameAddition(name, newDivCardBody);
            addingMoreInfoButton(id, newDivCardBody);
            addingMoreInfoContent(id, newDivCardBody);
            $("#coinsContainer").append(newDivCard);

        }

        //specific functions for the coins card shown on the UI in the home page and in the search page sections

        //adding the frame of the card
        function addingNewDivCard() {
            let newDivCard = $("<div>");
            newDivCard.addClass("card");
            return newDivCard;
        }
        //adding the body of card
        function addingNewDivCardBody(newDivCard) {
            let newDivCardBody = $("<div>");
            newDivCardBody.addClass("card-body");
            newDivCard.append(newDivCardBody);
            return newDivCardBody;
        }
        //adding the header of the card
        function addingHeaderDivCard(newDivCardBody) {
            let headerDivCard = $("<div>");
            headerDivCard.addClass("header-card");
            newDivCardBody.append(headerDivCard);
            return headerDivCard;
        }
        //adding the coins symbol to the header
        function addingHeaderSymbol(headerDivCard, symbol) {
            let headerSymbol = $("<div>");
            headerSymbol.addClass("headerSymbol");
            headerDivCard.append(headerSymbol);
            headerSymbol.html(symbol);

        }
        //adding toggle label of the toggle button
        function addingToggleLabel() {
            let toggleLabel = $("<label>");
            toggleLabel.addClass("switch");
            return toggleLabel;
        }

        //adding the checkbox input to the toggle button
        function addingcheckBoxInput() {
            let checkBoxInput = $("<input>");
            checkBoxInput.attr("type", "checkbox");
            checkBoxInput.prop("checked", false)
            return checkBoxInput;
        }
        //adding the slider span with an id based on the id of the coin
        function addingSliderSpan(id) {
            let sliderSpan = $("<span>");
            sliderSpan.addClass("slider");
            sliderSpan.addClass("round");
            sliderSpan.attr("id", "slider" + id);
            sliderSpan.attr("status", "off");
            return sliderSpan;
        }
        //adding the header and inside of it the name of coin
        function addingHeaderNameAddition(name, newDivCardBody) {
            let headerName = $("<span>");
            headerName.addClass("headerNameStyle")
            newDivCardBody.append(headerName);
            headerName.html(name);
        }

        //adding the more info button with the collapse animation
        function addingMoreInfoButton(id, newDivCardBody) {
            let moreInfoButton = $("<button>");
            moreInfoButton.attr("id", id);
            newDivCardBody.append(moreInfoButton);
            moreInfoButton.addClass("btn btn-primary btn-warning moreInfoButton");
            moreInfoButton.attr("type", "button");
            moreInfoButton.attr("data-toggle", "collapse");
            moreInfoButton.attr("data-target", "#moreInfoOfCoin" + id);
            moreInfoButton.html("More Info");
            newDivCardBody.append(moreInfoButton);
        }

        //adding the content from URL to the more info content collapse section
        function addingMoreInfoContent(id, newDivCardBody) {
            let infoContent = $("<div>");
            infoContent.addClass("collapse infoContent");
            infoContent.attr("id", "moreInfoOfCoin" + id);
            newDivCardBody.append(infoContent);
        }

        //Modal section  

        // a function that displays on the DOM the the modal
        function showModal(modalInitialArray) {
            // creating the elements of the modal : Divs for the modal frame,dialog,content,header and Body, including the coins symbol
            let divModal = divModalAddition();
            let divModalDialog = divModalDialogAddition(divModal);
            let divModalContent = divModalContentAddition(divModalDialog);
            let divModalHeader = divModalHeaderAddition(divModalContent, modalInitialArray[5]);
            headerAddition(divModalHeader, modalInitialArray[5].symbol);
            let divModalBody = divModalBodyAddition(divModalContent);

            // creating the toggle buttons for the relevant coins in the modal
            for (i = 0; i < liveReportsArray.length - 1; i++) {
                let headerDivCard = headerDivCardAddition(divModalBody)
                headerSymbolAddition(headerDivCard);
                let toggleLabel = toggleLabelAddition();
                let checkBoxInput = checkBoxInputAddition();
                let sliderSpan = sliderSpanAddition();
                AddingToggleLabelToHeaderDivCard(headerDivCard, toggleLabel, checkBoxInput, sliderSpan);
                AddingClickEventTosliderSpan(sliderSpan);
            }
            // creating the footer of the modal
            addingDivModalFooter(divModalContent);

            // creating the cancel button and adding an event which resets the last coin by pressing it
            let cancelButton = addingCancelButton(divModalContent);
            cancelButton.click(function () {
                resettingUiWhenCancellingModal(modalInitialArray);
                clearngContentInModal(divModal, divModalContent);
                modalInitialArray.pop();
                liveReportsArray = modalInitialArray.slice();
            })
            // creating the Save button and adding an event which resets the last coin if nothing was changed
            // or resets other coins and not the last coin,  depending on the users preferences
            let saveButton = addingSaveButton(divModalContent)
            saveButton.click(function () {
                if (liveReportsArray.length == 6) {
                    resettingUiWhenCancellingModal(modalInitialArray);
                    clearngContentInModal(divModal, divModalContent);
                    modalInitialArray.pop();
                    liveReportsArray = modalInitialArray.slice();
                } else {
                    let filteredArray = modalInitialArray.filter(element => !liveReportsArray.includes(element));
                    let notFilteredArray = modalInitialArray.filter(element => liveReportsArray.includes(element));
                    updateCoinsOnUIAfterCLicks(filteredArray, "off", false)
                    updateCoinsOnUIAfterCLicks(notFilteredArray, "on", true)
                    clearngContentInModal(divModal, divModalContent)
                }
            })

            $("#modalContainer").append(divModal);
        }


        //Specific Modal functions

        // a function that creates the div container of the modal
        function divModalAddition() {
            let divModal = $("<div>");
            divModal.addClass("modal fade show");
            // divModal.attr("id", "exampleModalLong");
            divModal.attr("tabindex", "-1");
            divModal.attr("role", "dialog");
            // divModal.attr("aria-labelledby", "exampleModalLongTitle");
            divModal.attr("aria-hidden", "true");
            divModal.attr("style", "display: block");
            return divModal;
        }
        // a function that adds a div dialog to the main div of the modal
        function divModalDialogAddition(divModal) {
            let divModalDialog = $("<div>");
            divModalDialog.addClass("modal-dialog");
            divModalDialog.attr("role", "document");
            divModal.append(divModalDialog);
            return divModalDialog;
        }

        // creating the a content div inside the dialog div in the main div of the modal
        function divModalContentAddition(divModalDialog) {
            let divModalContent = $("<div>");
            divModalContent.addClass("modal-content");
            divModalDialog.append(divModalContent);
            return divModalContent;
        }
        // creating a div header and putting it in the content div of the modal
        function divModalHeaderAddition(divModalContent) {
            let divModalHeader = $("<div>");
            divModalHeader.addClass("modal-header");
            divModalContent.append(divModalHeader);
            return divModalHeader;
        }
        // adding appropiate content to the div header of the modal
        function headerAddition(divModalHeader, lastCoinChosen) {
            let header = $("<h5>");
            header.addClass("modal-title");
            // header.attr("id", "exampleModalLongTitle");
            header.html("Dear user, you can have only up to 5 coins for the live reports." +
                " The last coin you chose is: " + "<u>" + lastCoinChosen.toUpperCase() + "</u>" + " ,please cancel this choice or remove other coins.");
            console.log(header.html())
            divModalHeader.append(header);
        }
        // adding the body for the coins symbol and toggle button in the content div of the modal
        function divModalBodyAddition(divModalContent) {
            let divModalBody = $("<div>");
            divModalBody.addClass("modal-body");
            divModalContent.append(divModalBody);
            return divModalBody;
        }
        // adding a header div card for the coin symbol into the body of the modal
        function headerDivCardAddition(divModalBody) {
            let headerDivCard = $("<div>");
            headerDivCard.addClass("header-card");
            divModalBody.append(headerDivCard)
            return headerDivCard;
        }
        // adding the symbol name to the header div card for the coin symbol inside the body of the modal
        function headerSymbolAddition(headerDivCard) {
            let headerSymbol = $("<div>");
            headerSymbol.addClass("headerSymbol");
            headerDivCard.append(headerSymbol);
            headerSymbol.html(liveReportsArray[i].symbol.toUpperCase());
        }
        // creating a toggle label
        function toggleLabelAddition() {
            let toggleLabel = $("<label>");
            toggleLabel.addClass("switch");
            return toggleLabel;
        }
        // creating a check input box
        function checkBoxInputAddition() {
            let checkBoxInput = $("<input>");
            checkBoxInput.attr("type", "checkbox");
            checkBoxInput.prop("checked", true);
            return checkBoxInput;
        }
        // creating a span for the slider
        function sliderSpanAddition() {
            let sliderSpan = $("<span>");
            sliderSpan.addClass("slider");
            sliderSpan.addClass("round");
            // need to put a different id for modal element
            sliderSpan.attr("id", "sliderModal" + liveReportsArray[i].id);
            sliderSpan.attr("status", "on");
            return sliderSpan;
        }

        // adding toggle label to the header div card of the coin, while inserting inside of it the slider span and the checkbox input
        function AddingToggleLabelToHeaderDivCard(headerDivCard, toggleLabel, checkBoxInput, sliderSpan) {
            toggleLabel.append(checkBoxInput);
            toggleLabel.append(sliderSpan);
            headerDivCard.append(toggleLabel);
        }
        // A function that creates a footer for the modal and adds it to the content div
        function addingDivModalFooter(divModalContent) {
            let divModalFooter = $("<div>");
            divModalFooter.addClass("modal-footer");
            divModalContent.append(divModalFooter);
        }

        //A function that creates a cancel button for the modal and adds it to the content div
        function addingCancelButton(divModalContent) {
            let cancelButton = $("<button>");
            cancelButton.attr("type", "button");
            cancelButton.addClass("btn btn-secondary");
            cancelButton.attr("data-dismiss", "modal");
            cancelButton.html("Cancel");
            divModalContent.append(cancelButton);
            return cancelButton;
        }

        //A function that creates a save button for the modal and adds it to the content div
        function addingSaveButton(divModalContent) {
            let saveButton = $("<button>");
            saveButton.attr("type", "button");
            saveButton.addClass("btn btn-secondary");
            saveButton.html("Save");
            divModalContent.append(saveButton);
            return saveButton;
        }

        // A function that resets  the UI with the current status of the first 5 coins toggled on, if cancelling the modal
        function resettingUiWhenCancellingModal(array) {
            // we run on the first 5 coins in the initial modal array and toggle everything ON on the UI
            for (i = 0; i < array.length - 1; i++) {
                let sliderElement = $("#" + "slider" + array[i].id);
                sliderElement.attr("status", "on");
                sliderElement.prev().prop("checked", true);
            }
            // the last coin on the initial modal array we toggle if OFF on the UI
            let sliderElement = $("#" + "slider" + array[5].id);
            sliderElement.attr("status", "off");
            sliderElement.prev().prop("checked", false);
        }

        // A function that clears the modal in order for to further interact with the website
        function clearngContentInModal(divModal, divModalContent) {
            divModal.attr("class", "modal fade");
            divModal.attr("style", "display: none");
            divModalContent.empty();

        }



        // About page section

        // display about information on the fly on the DOM in a cheerful freestyle
        function showAboutInfoOnUI() {
            //Creating elements : Div,Hedaer and span with my personal information and adding it to the DOM
            let mainDivInfo = $("<div>");
            mainDivInfo.attr("id", "mainDivInfo");
            mainDivInfo.addClass("container");
            let header = $("<h1>")
            header.attr("id", "infoHeaderAbout")
            header.html("Personal Information")
            let myInfo = $("<span>")
            myInfo.attr("id", "myInfo")
            myInfo.html("Hello my name is Milton 🧔 and I live in Ramat Gan. <br> <br> I work as an analyst in a financial consulting" +
                " company👩‍💻👨‍💻👨‍💻.<br> <br> My hobbies are:<br> <br> Play great games such as The Last Of Us and God Of War🦸‍♂️ <br> <br>" +
                "Watch interesting movies such as The Road and The Queen Of Hearts💖🧡❤ <br> <br> Travel abroad when there's no Corona 😂" +
                "And of course CODING <br> <br> Now for the real deal - the WEBSITE! 🧐🧐🧐🧐 ");
            $("#coinsContainer").append(mainDivInfo);
            mainDivInfo.append(header);
            mainDivInfo.append(myInfo);

            //Creating elements : Div,Hedaer and span with the website information and adding it to the DOM
            let header2 = $("<h1>")
            header2.attr("id", "webHeaderAbout")
            header2.html("Website Information")
            mainDivInfo.append(header2);
            let webInfo = $("<span>")
            webInfo.html("In this site you can search for different Crypto coins.<br> <br> The website is divided into 2 main sections: Home and live reports sections.<br> <br>" +
                "In the Home section you can see all the coins from the database.<br> You can also search for specific coins by their symbol<br>and get current information about their USD, EURO and ILS currencies <br><br>" +
                "In the Live reports section, you can get the real time price (in $)<br> of the coins you chose and present it live on a graph.<br>" +
                "Please notice that you can present up to 5 coins on the live graph.");
            mainDivInfo.append(webInfo);

            //Creating elements : header and an image for the final conclusion of the about section and adding it to the DOM
            let header3 = $("<h1>")
            header3.attr("id", "enjoyHeader")
            header3.html("Enjoy")
            mainDivInfo.append(header3);
            let image = $("<img>");
            image.attr("src", "./images/me4.jpg");
            image.attr("id", "dogImage");
            mainDivInfo.append(image);

        }
        // display a loading slider for the more info section
        function showLoadingSLider(content) {
            let spinnerDiv = $("<div>")
            spinnerDiv.addClass("spinner-border text-primary");
            spinnerDiv.attr("role", "status");
            let spinnerSpan = $("<span>");
            spinnerSpan.addClass("sr-only");
            spinnerSpan.html("Loading");
            spinnerDiv.append(spinnerSpan);
            content.append(spinnerDiv);
        }


        //A function that get a more info coins object, validates it and then displays it 
        function showMoreInfoOfCurrentCurrencyOnUI(moreInfoOjbect, content) {
            let imageURL = moreInfoOjbect.imageURL;
            let USDPrice = moreInfoOjbect.USDPrice;
            let EURPrice = moreInfoOjbect.EURPrice;
            let ILSPrice = moreInfoOjbect.ILSPrice;
            let image = $("<img>");
            console.log(USDPrice)
            //more info data validation
            imageURL = MoreInfoDataValidation(imageURL);
            USDPrice = MoreInfoDataValidation(USDPrice);
            EURPrice = MoreInfoDataValidation(EURPrice);
            ILSPrice = MoreInfoDataValidation(ILSPrice);
            //displaying the more info data on the UI
            displayMoreInfoUiWithrelevantInformation(imageURL, USDPrice, EURPrice, ILSPrice, image, content)

        }

        // A function that puts the appropiate information if we have or dont have information on the three currencies of the coin and displaying it accordingly
        function displayMoreInfoUiWithrelevantInformation(imageURL, USDPrice, EURPrice, ILSPrice, image, content) {
            console.log(USDPrice);
            if (USDPrice == "No info") {
                USDPriceMessage = "USDPrice: " + USDPrice + " <br> ";
            } else {
                USDPriceMessage = "USDPrice :" + "$" + USDPrice + " <br> ";
            }

            if (EURPrice === "No info") {
                EURPriceMessage = "EURPrice: " + EURPrice + " <br> ";
            } else {
                EURPriceMessage = "EURPrice :" + "€" + EURPrice + " <br> ";
            }

            if (ILSPrice === "No info") {
                ILSPriceMessage = "ILSPrice: " + ILSPrice + " <br> ";
            } else {
                ILSPriceMessage = "ILSPrice :" + ILSPrice + "₪" + " <br> ";
            }

            image.attr("src", imageURL);;
            image.attr("class", "coinImage");
            content.html(USDPriceMessage + EURPriceMessage + ILSPriceMessage);
            content.append(image);

        }


        // A function that updates the toggle status of the coins in the attr and also on the UI
        function updateCoinsOnUIAfterCLicks(array, statusValue, booleanChecked) {
            if (array.length != 0) {
                for (i = 0; i < array.length; i++) {
                    $("#" + "slider" + array[i].id).attr("status", statusValue);
                    $("#" + "slider" + array[i].id).prev().prop("checked", booleanChecked);
                }
            }
        }

        // a function that creates an element of a loading DIV with relevant content - it is used upon uploading the website and the graph
        function showLoadingDiv(contentForLoadingDiv) {
            //Creating loading button and adding it to the coins container
            let loadingButton = $("<button>");
            loadingButton.addClass("btn btn-primary");
            loadingButton.attr("id", "loadingButton")
            loadingButton.attr("type", "button")
            loadingButton.attr("disabled", "true")
            $("#coinsContainer").append(loadingButton);
            // creating the spinner and adding it to the loading button
            let spanButton = $("<span>");
            loadingButton.append(spanButton);
            spanButton.addClass("spinner-border spinner-border-md");
            spanButton.attr("id", "spinner")
            spanButton.attr("role", "status")
            spanButton.attr("aria-hidden", "true")
            let spanContent = $("<span>");
            spanContent.html(contentForLoadingDiv)
            loadingButton.append(spanContent)

        }

        // clearing the UI interface
        function clearUI() {
            $("#coinsContainer").empty();
        }
        // Resetting The UI
        function UIReset() {
            //Clearing the the interval of the graph
            clearInterval(graphInterval);
            // clearing the UI interface
            clearUI();
        }


        //Model Functions

        // A function that get coins from the URL and displays them
        function getCoinsFromUrl(DOMAIN, queryString) {
            let allCurrenciesUrl = DOMAIN + queryString;
            if (coinsMapWithSymbolAsId.size == 0) {
                $.get(allCurrenciesUrl).then(function (data) {
                    // let coinsArray = data
                    // This is used for the alternative URL in order to not slow the website
                    let coinsArray = data.slice(0, 100);
                    // Updating the coinsArray symbol to lower case for easier search
                    coinsArray = turnSymbolOfArrayToLowerCase(coinsArray);
                    // Creating a map with id as key and another map with symbol as key
                    buildMapFromArrayWithSymbolAsKey(coinsArray);
                    buildMapFromArrayWithIdlAsKey(coinsArray);
                    //Resetting all elements on the user interaface
                    UIReset();
                    // a function that creates the card elements on page with the relevant details
                    showCoinsOnUI();
                })
                    .catch(function (error) {
                        alert("OOPS something Wrong Happened , Please refresh the website or try later to upload it ");
                        console.log(error);
                    })
            }
        }

        // This function get the more info for the coin from URL or cache and displays it
        function getMoreInfoForCurrencyAndDisplay(DOMAIN, mainUrlQueryString, queryString, content, id) {
            let allCurrentCurrencyUrl = DOMAIN + mainUrlQueryString + queryString;
            // if we have the id in the cache then we get it from the cache and display it 
            if (moreInfoCache.has(id)) {
                let moreInfoOjbect = getDataFromMoreInfoCache(id);
                showMoreInfoOfCurrentCurrencyOnUI(moreInfoOjbect, content);
                console.log(moreInfoCache)
            } else {
                // if the cache doesnt have the id then we get the information from URL and display it 
                content.empty();
                showLoadingSLider(content)
                getMoreInfoDataFromURL(allCurrentCurrencyUrl, content, id);
            }
        }
        // A function that get more information data from the URL
        function getMoreInfoDataFromURL(allCurrentCurrencyUrl, content, id) {
            $.get(allCurrentCurrencyUrl).then(function (data) {
                let imageURL = data.image.small;
                let USDPrice = data.market_data.current_price.usd;
                let EURPrice = data.market_data.current_price.eur;
                let ILSPrice = data.market_data.current_price.ils;
                // Creating an object with the relevant information and adding it to the cache
                let moreInfoOjbect = moreInfoObjectConstructor(imageURL, USDPrice, EURPrice, ILSPrice);
                moreInfoCache.set(id, moreInfoOjbect);
                //Calling a function that deletes the cache with this id after 2 minutes
                deleteCoinCacheAfterTwoMinutes(id)
                //Calling a function that displays the more information on the UI
                showMoreInfoOfCurrentCurrencyOnUI(moreInfoOjbect, content);
                console.log(moreInfoCache)
            })

                .catch(function (error) {
                    alert("OOPS something Wrong Happened , Please refresh the website or try later to upload it ");
                    console.log(error);
                })
        }

        // This functions deletes the more info cache every 2 minutes
        function deleteCoinCacheAfterTwoMinutes(id) {
            setTimeout(function () {
                // alert("HELLO");
                moreInfoCache.delete(id);
                console.log(moreInfoCache);
            }, 120000);
        }


        // Graph Section

        //When called this function renders the graph elements on the DOM while getting information every 2 seconds
        function showGraphOnUIAfterDownloadingInfo(URLForGraphStart, URLForGraphEnd, coinQueryStringWithoutLastChar, options) {
            //Getting the relevant URL for the coins to be presented on the graph
            let URLforGraphInfoDownload = URLForGraphStart + coinQueryStringWithoutLastChar + URLForGraphEnd;
            //Clearing the UI and showing a lodaing div 
            clearUI();
            //Creating a chart container and adding it to the coins container
            let chartContainer = $("<div>");
            chartContainer.attr("id", "chartContainer");
            $("#coinsContainer").append(chartContainer);
            //creating the graph object 
            createLiveGraphObject(coinQueryStringWithoutLastChar, URLforGraphInfoDownload, options);
            // updating the points every 2 seconds
            graphInterval = setInterval(function () {
                updateDataPoints(URLforGraphInfoDownload, options);
            }, 2000);
        }



        //CanvasJs Functions

        // Creating the datapoints object with the URL info
        function createLiveGraphObject(coinQueryStringWithoutLastChar, URLforGraphInfoDownload, options) {
            options.title.text = coinQueryStringWithoutLastChar + " to USD";
            $.get(URLforGraphInfoDownload)
                .then(function (coinsData) {
                    for (let [key, value] of Object.entries(coinsData)) {
                        let dataObject = {
                            type: "spline",
                            name: key,
                            showInLegend: true,
                            xValueFormatString: "MMM YYYY",
                            yValueFormatString: "#,##0 USD",
                            dataPoints: [{
                                x: new Date(),
                                y: value.USD
                            }]
                        }
                        options.data.push(dataObject);
                    }
                    $("#chartContainer").CanvasJSChart(options);
                })
                .catch(error => console.log(error));
        }

        //Creating the options variable which has the datapoints for the graph
        function optionsCreationForGraph() {
            let options = {
                // exportEnabled: true,
                animationEnabled: false,
                title: {
                    text: ""
                },
                subtitles: [{
                    text: "Click Legend to Hide or Unhide Data Series"
                }],
                axisX: {
                    title: new Date()
                },
                axisY: {
                    title: "Price in USD",
                    titleFontColor: "#4F81BC",
                    lineColor: "#4F81BC",
                    labelFontColor: "#4F81BC",
                    tickColor: "#4F81BC",
                    includeZero: false
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    cursor: "pointer",
                    itemclick: toggleDataSeries
                },
                data: []
            };
            return options;
        }
        // Rendering the canvas chart  //
        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.chart.render();
        }

        // Get coins info from the URL on the fly after creating the graph  for each second and updating the graph on the canvas
        function updateDataPoints(URLforGraphInfoDownload, options) {
            $.get(URLforGraphInfoDownload)
                .then(function (coinsData) {
                    for (let [key, value] of Object.entries(coinsData)) {
                        for (let index = 0; index < options.data.length; index++) {
                            if (options.data[index].name == key) {
                                let dataPoints = {
                                    x: new Date(),
                                    y: value.USD
                                };
                                options.data[index].dataPoints.push(dataPoints);
                            }
                        }
                    }
                    $("#chartContainer").CanvasJSChart(options);
                })
                .catch(error => console.log(error));
        }

        // A function the renders the chart
        function toggleDataSeries(e) {
            if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                e.dataSeries.visible = false;
            } else {
                e.dataSeries.visible = true;
            }
            e.chart.render();
        }

        //Logic function

        // A validation function that checks wether the more info values are valid. If not it returns no Info to the variable
        function MoreInfoDataValidation(info) {
            if ((info === undefined) || (info === null)) {
                info = "No info";
            }
            return info;

        }

        // A function that creats an object to be returned when this function is called
        function moreInfoObjectConstructor(imageURLValue, USDPriceValue, EURPriceValue, ILSPriceValue) {
            let moreInfoObject = {
                imageURL: imageURLValue,
                USDPrice: USDPriceValue,
                EURPrice: EURPriceValue,
                ILSPrice: ILSPriceValue
            }
            return moreInfoObject;

        }
        // a function that creates a map for an array where the symbol is key
        function buildMapFromArrayWithSymbolAsKey(array) {
            console.log(array)
            for (i = 0; i < array.length; i++) {
                let key = array[i].symbol;
                let value = {
                    id: array[i].id,
                    symbol: array[i].symbol,
                    name: array[i].name,
                }
                // if the map doesnt have a key with this symbol then we add id to the map
                if (!coinsMapWithSymbolAsId.has(key)) {
                    coinsMapWithSymbolAsId.set(key, value)
                } else {
                    // if the map has a key with this symbol , then for this key symbol we have either one value or an array of values
                    // if its an array then we we simply add to it the value , if we have one value then create an array of two values. The result we set in the map
                    let oldValueOfMap = coinsMapWithSymbolAsId.get(key);
                    if (Array.isArray(oldValueOfMap)) {
                        oldValueOfMap.push(value)
                        coinsMapWithSymbolAsId.set(key, oldValueOfMap)
                    } else {
                        oldValueOfMap = [oldValueOfMap, value];
                        coinsMapWithSymbolAsId.set(key, oldValueOfMap)
                    }
                }
            }
            console.log(coinsMapWithSymbolAsId);
        }

        // a function that updates the coins query string for the live reports
        function updateCoinsQueryStringForLiveReport(coinsQueryString) {
            for (i = 0; i < liveReportsArray.length; i++) {
                coinsQueryString = coinsQueryString + liveReportsArray[i].symbol.toUpperCase() + ",";
            }
            var coinQueryStringWithoutLastChar = coinsQueryString.slice(0, coinsQueryString.length - 1)
            return coinQueryStringWithoutLastChar;
        }

        //This function searches the coin and shows it if it finds it in the map
        function searchAndDisplayCoin(searchInputValue) {
            //If the search input is found then we show it on the UI
            if (coinsMapWithSymbolAsId.has(searchInputValue)) {
                let foundArrayInCoinArray = coinsMapWithSymbolAsId.get(searchInputValue);
                console.log(foundArrayInCoinArray);
                //Calling the function that shows coins info on the UI, plus updating its toggle state and resetting the search input value
                showElementsOnUI(foundArrayInCoinArray.id, foundArrayInCoinArray.symbol.toUpperCase(), foundArrayInCoinArray.name)
                $("#searchInputValue").val("");
                updateCoinsOnUIAfterCLicks(liveReportsArray, "on", true);
            } else {
                //If the search input is not found then the user get an appropiate alert , plus we show all the coins on the UI, update their toggle state and reset 
                // the search input vale
                alert("OOPS the search value is not valid!!!!, if you didnt write anything please write a symbol, else please " +
                    "notice the coin you searched is not in the database, so please check if you have any mispelling mistakes.")
                showCoinsOnUI();
                updateCoinsOnUIAfterCLicks(liveReportsArray, "on", true);
                $("#searchInputValue").val("");
            }
        }

        // This function creates a map where its key is the ID
        function buildMapFromArrayWithIdlAsKey(array) {
            for (i = 0; i < array.length; i++) {
                let key = array[i].id;
                let value = {
                    id: array[i].id,
                    symbol: array[i].symbol,
                    name: array[i].name,
                }
                coinsMapWithIdAsID.set(key, value)
            }
        }

        // A validation function for the modal pop-up - if we toggle 6 coins then the Modal pops up
        function validationForModalPopUp() {
            if (liveReportsArray.length == 6) {
                //breaking reference - If we get 6 coins toggled then we save the coins toggled in a cloned array so the live reports array is not modified
                let modalInitialArray = liveReportsArray.slice()
                console.log(modalInitialArray)
                showModal(modalInitialArray);
            }
        }
        // a function that adds an event to the slider span if we click on it when the modal shows up
        function AddingClickEventTosliderSpan(sliderSpan) {
            sliderSpan.click(function () {
                // Here we get the slider Id and then slice it in order to get id in the livereports array
                let sliderId = sliderSpan.attr("id");
                let idOfsliderModal = sliderId.slice(11, sliderId.length)
                //In this IF statement we check the status of toggled coin and approipately use id in order to update the live reports array
                if (sliderSpan.attr("status") == "on") {
                    sliderSpan.attr("status", "off")
                    // Deleting the modal id because we toggled if off!
                    deleteLiveReportsArray(idOfsliderModal)
                    console.log(liveReportsArray);
                } else {
                    sliderSpan.attr("status", "on")
                    console.log(liveReportsArray);
                    // Adding the relevant infomation of the coin to the live reports array because we toggled on!
                    addingCoinToLiveReportsArray(idOfsliderModal)
                }
            })
        }

        // we get the id from the from live reports array in order to delete the reference from it afterwards
        function deleteLiveReportsArray(id) {
            let index = liveReportsArray.findIndex(function (element) {
                return element.id == id;
            });
            liveReportsArray.splice(index, 1);
        }
        // we get the coins information from the map and put it into the live reports array if we toggled it on
        function addingCoinToLiveReportsArray(id) {
            let infoOfCoinforReportArray = coinsMapWithIdAsID.get(id);
            liveReportsArray.push(infoOfCoinforReportArray);
        }

        // In this functions we get the more info data from the cache by the ID and then use a functions to put the information in an object with a format that is
        //easy to use in the show More Info Of Current Currency On UI function
        function getDataFromMoreInfoCache(id) {
            let currencyObjectOfMap = moreInfoCache.get(id);
            let imageURL = currencyObjectOfMap.imageURL;
            let USDPrice = currencyObjectOfMap.USDPrice;
            let EURPrice = currencyObjectOfMap.EURPrice;
            let ILSPrice = currencyObjectOfMap.ILSPrice;
            // calling an object constructor to put the data in an object in order to return it for use of the how More Info Of Current Currency On UI function
            let moreInfoOjbect = moreInfoObjectConstructor(imageURL, USDPrice, EURPrice, ILSPrice);
            return moreInfoOjbect;
        }

        // we trim the search value and also turn it to lower case in order to have a valid search
        function searchInputValueModifications(searchInputValue) {
            let searchInputValueValidForSearch = searchInputValue.trim();
            console.log(searchInputValue)
            searchInputValueValidForSearch = searchInputValueValidForSearch.toLowerCase();
            console.log(searchInputValue)
            return searchInputValueValidForSearch;
        }

        //We turn all symbols fonts to lower cases in because the search is case sensitive 
        function turnSymbolOfArrayToLowerCase(coinsArray) {
            console.log(coinsArray)
            for (i = 0; i < coinsArray.length; i++) {
                coinsArray[i].symbol = coinsArray[i].symbol.toLowerCase();
            }
            return coinsArray;
        }
    });
})();