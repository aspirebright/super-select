import { LightningElement, api, wire, track } from 'lwc';
import { getObjectInfo, getPicklistValues } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from "lightning/platformShowToastEvent";

export default class SuperSelect extends LightningElement {

    @api 
    config;

    @track
    configTrack;

    @track
    picklistValues;

    @track
    recordTypeId;

    @track
    picklistFieldApiName;

    @track
    selectedItemsMap = new Map();

    @track removedItems = [];

    showList = false;

    errorMessage = undefined;

    hadFocus = false;

    get isReadonly() {
        return this.configTrack.mode === "read" ? true : this.getStringDefault(this.configTrack.mode) === "" ? true : false; 
    }
    
    get isEditable() {
        return this.configTrack.mode === "edit" ? true : false; 
    }

    get isPicklist () {
        return this.configTrack.dataSource.type === "picklist" || this.getStringDefault(this.configTrack.dataSource.type) === "";
    }

    get isJSONArray () {
        return this.configTrack.dataSource.type === "jsonArray";
    }

    get objectApiName () {
        return this.configTrack.dataSource.objectApiName;
    }

    get showListbox() {
        return (this.configTrack
                && this.configTrack.filteredSuggestedItems 
                && this.configTrack.filteredSuggestedItems.length > 0
                && (this.showList || this.configTrack.alwaysShowList)                
               );
    }

    get showRequiredAsterisk () {
        if (this.configTrack.required) {
            this.triggerRequiredFieldValidation();
            return this.configTrack.required.asterisk;
        }        
    }

    triggerRequiredFieldValidation() {
        if (this.configTrack.required) {
            if (    
                this.hadFocus
                && this.configTrack 
                && this.configTrack.filteredSuggestedItems 
                && this.configTrack.filteredSuggestedItems.length > 0
                && !this.selectedItemsMap.size>0 
            ) {
                this.errorMessage = this.configTrack.required.message ? this.configTrack.required.message : "Complete this field.";
            }
        } 
    }

    //css getters
    get comboboxContainerClasses () {
        let classes = "slds-combobox_container slds-has-inline-listbox min-height-32px";
        classes += this.showListbox ? "slds-has-input-focus" : "";
        return classes; 
    }

    get dropdownClasses () {
        let classes = "slds-combobox slds-dropdown-trigger slds-dropdown-trigger_click  ";
        classes += this.showListbox ? "slds-is-open" : "slds-combobox-lookup";
        return classes; 
    }

    get inputClasses () {
        let classes = "slds-input slds-combobox__input input-super-style ";
        classes += 'slds-combobox__input-value ';
        return classes; 
    }

    get inputDivClasses () {
        let classes = "slds-combobox__form-element slds-input-has-icon slds-input-has-icon_right";
        classes += 'slds-combobox__input-value border-shodow-none';
        return classes; 
    }

    get listboxStyle() {
        return this.configTrack.listOverflowStyle ? this.configTrack.listOverflowStyle : "overflow-y: auto !important; max-height: 100px !important;";
    }

    get hasSelections () {
        return this.selectedItemsMap.size > 0 ? true : false;
    }

    get hasFilteredSuggestions () {
        return this.configTrack.filteredSuggestedItems.length > 0 ? true : false;
    }

    //getting object metadata
    @wire(getObjectInfo, { objectApiName: "$objectApiName" })
    objectInfo({error, data}){
        if (data) {
            let objectMetadataInfo = data;
            this.isPicklist ? this.processRecordtypeInfo(objectMetadataInfo) : null; 
        } 
    }
    
    @wire(getPicklistValues, {recordTypeId: "$recordTypeId", fieldApiName: "$picklistFieldApiName" })
    picklistValuesInfo({error, data}){
        if (data) {
            this.picklistValues = data;
            this.initiateDefaultSelections();
            this.isPicklist ? this.processPicklist() : null; 
        } 
    }

    connectedCallback() {
        let localConfig = {};
        if (this.config.selectedItems) {
            localConfig = Object.assign({suggestedItems: [], filteredSuggestedItems: []}, this.config);              
        } else {
            localConfig = Object.assign({suggestedItems: [], filteredSuggestedItems: [], selectedItems:[]}, this.config);   
        }
        this.configTrack = JSON.parse(JSON.stringify(localConfig));
        if (this.configTrack.dataSource.type === 'jsonArray') {
            this.initiateDefaultSelections();
            this.processJSONArray();
        }
        this.picklistFieldApiName  = this.configTrack.dataSource.picklist && this.configTrack.dataSource.picklist.fieldApiName ? this.configTrack.dataSource.picklist.fieldApiName : undefined;
    }

    initiateDefaultSelections() {
        if (this.configTrack.selectedItems && this.configTrack.selectedItems.length > 0) {
            for (let i = 0; i < this.configTrack.selectedItems.length; i++){
                this.selectedItemsMap.set(this.configTrack.selectedItems[i].value, this.configTrack.selectedItems[i]);     
            }
        }        
    }

    @api
    getSelectedData () {
        return {
            selectedItems: this.selectedItemsMap.size > 0 ? Array.from(this.selectedItemsMap.values()) : undefined
        };
    }

    @api
    setSelectedData (jsonArray) {
        this.resetSelection(Array.from(this.selectedItemsMap.values()), undefined, undefined);
        this.selectedItemsMap = new Map();
        this.resetRemoval(jsonArray, undefined, undefined);
    }
    
    @api
    setConfig (config) {
        this.configTrack = Object.assign({}, config);
    }

    @api
    resetSelection (itemsToRemove, errorMessage, messageType) { //itemsToRemove(jsonArray), errorMessage(String), messageType(String = toast/field-error)
        if (itemsToRemove) {
            for (let i = 0; i < itemsToRemove.length; i++) {
                this.selectedItemsMap.delete(itemsToRemove[i].value);  
            }
            let inputText = this.template.querySelector('[data-id="inputElement"]').value;
            this.configTrack.filteredSuggestedItems = [];
            if (inputText.length>0) {
                this.configTrack.filteredSuggestedItems = this.configTrack.suggestedItems.filter(element => element.label.toUpperCase().includes(inputText.toUpperCase()));
            } else {
                this.configTrack.filteredSuggestedItems = [...this.configTrack.suggestedItems];
            }
            if (this.configTrack.filteredSuggestedItems.length>0) {
                for (let i = 0; i < this.configTrack.filteredSuggestedItems.length; i++) {
                    if (this.selectedItemsMap.has(this.configTrack.filteredSuggestedItems[i].value)) {
                        this.configTrack.filteredSuggestedItems.splice(i, 1);  
                        if ((i-1) < this.configTrack.filteredSuggestedItems.length) {
                            i = i - 1;
                        } else {
                            break;
                        } 
                    }
                }
            }
            if (errorMessage && messageType) {
                this.setErrorMessage(errorMessage, messageType ? messageType : "field-error");      
            }  
        }              
    }

    setErrorMessage(errorMessage, messageType) {
        if (messageType.toLowerCase()==="field-error") {
            this.errorMessage = errorMessage;
        } else {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: "Error",
                    message: errorMessage,
                    variant: "error",
                    mode: "pester"
                }),
            );
        }        
    }

    @api
    resetRemoval (itemsToReSelect, errorMessage, messageType) { //itemsToReSelect(jsonArray), errorMessage(String), messageType(String = toast/field-error)
        if (itemsToReSelect) {
            let reselectItemsMap = new Map();
            for (let i = 0; i < itemsToReSelect.length; i++){
                reselectItemsMap.set(itemsToReSelect[i].value, itemsToReSelect[i]);     
            }
            if (this.configTrack.multiSelect && this.configTrack.multiSelect === true) {
                for (let i = 0; i < this.configTrack.filteredSuggestedItems.length; i++) {
                    if (reselectItemsMap.has(this.configTrack.filteredSuggestedItems[i].value)) {
                        this.selectedItemsMap.set(this.configTrack.filteredSuggestedItems[i].value, this.configTrack.filteredSuggestedItems[i]);
                        this.configTrack.filteredSuggestedItems.splice(i, 1); 
                        if ((i-1) < this.configTrack.filteredSuggestedItems.length) {
                            i = i - 1;
                        } else {
                            break;
                        }                
                    }            
                }
            } else {
                this.selectedItemsMap = new Map();
                let suggestedItems = [...this.configTrack.suggestedItems];
                for (let i = 0; i < suggestedItems.length; i++) {
                    if (reselectItemsMap.has(suggestedItems[i].value)) {
                        this.selectedItemsMap.set(suggestedItems[i].value, suggestedItems[i]);
                        suggestedItems.splice(i, 1);                     
                        break;      
                    }            
                }
                let inputText = this.template.querySelector('[data-id="inputElement"]').value;
                this.configTrack.filteredSuggestedItems = [];
                if (inputText.length>0) {
                    this.configTrack.filteredSuggestedItems = suggestedItems.filter(element => element.label.toUpperCase().includes(inputText.toUpperCase()));
                } else {
                    this.configTrack.filteredSuggestedItems = [...suggestedItems];
                }
            } 
            if (errorMessage && messageType) {
                this.setErrorMessage(errorMessage, messageType ? messageType : "field-error");      
            }  
        }         
    }


    processRecordtypeInfo (objectMetadataInfo) {
        if (objectMetadataInfo) {
            if (this.configTrack.dataSource.picklist && this.configTrack.dataSource.picklist.recordTypeDeveloperName) {
                let recordtypeinfo = objectMetadataInfo.recordTypeInfos;
                for (let eachRecordtype in objectMetadataInfo.recordTypeInfos) {
                    if (recordtypeinfo.hasOwnProperty(eachRecordtype)) {
                        if (recordtypeinfo[eachRecordtype].name === this.configTrack.dataSource.picklist.recordTypeDeveloperName) {
                            this.configTrack.dataSource.picklist.recordTypeId = recordtypeinfo[eachRecordtype].id;                            
                        }
                    }
                }
            }
            if (this.configTrack.dataSource.picklist.recordTypeId === undefined) {
                this.configTrack.dataSource.picklist.recordTypeId = objectMetadataInfo.defaultRecordTypeId;
            }
            this.recordTypeId = this.configTrack.dataSource.picklist.recordTypeId;
        }
    }

    processPicklist () {
        let subLabelMap = new Map();
        if (this.configTrack.dataSource && this.configTrack.dataSource.picklist && this.configTrack.dataSource.picklist.valueSubLabelMap) {
            subLabelMap = new Map(Object.entries(this.configTrack.dataSource.picklist.valueSubLabelMap));
        }        
        this.picklistValues.values.forEach(element => {      
                let listItemJSON = { 
                    value: element.value, 
                    label: element.label,
                    subLabel: subLabelMap.size > 0 && subLabelMap.has(element.value) ? subLabelMap.get(element.value) : undefined,
                    cssClasses: "",
                    icon: this.configTrack.icon ? this.configTrack.icon : undefined                
                };      
                this.configTrack.suggestedItems.push(listItemJSON);
                if (!this.selectedItemsMap.has(element.value)) {
                    this.configTrack.filteredSuggestedItems.push(listItemJSON);
                }
         });
         if (this.configTrack.sort !== undefined && this.getStringDefault(this.configTrack.sort.order) !== "" && this.getStringDefault(this.configTrack.sort.order) !== "custom" && this.getStringDefault(this.configTrack.sort.field) !== ""){
            if (this.configTrack.sort.order.toLowerCase() === 'asc'){
                this.configTrack.suggestedItems = this.configTrack.suggestedItems.sort(this.compareValues(this.configTrack.sort.field, 'asc'));
                this.configTrack.filteredSuggestedItems = this.configTrack.filteredSuggestedItems.sort(this.compareValues(this.configTrack.sort.field, 'asc'));
            } else if (this.configTrack.sort.order.toLowerCase() === 'desc') {
                this.configTrack.suggestedItems = this.configTrack.suggestedItems.sort(this.compareValues(this.configTrack.sort.field, 'desc'));
                this.configTrack.filteredSuggestedItems = this.configTrack.filteredSuggestedItems.sort(this.compareValues(this.configTrack.sort.field, 'desc'));
            }  
        }
    }

    processJSONArray () {
        this.configTrack.dataSource.jsonArray.forEach(element => {      
                let listItemJSON = { 
                    value: element.value, 
                    label: element.label,
                    subLabel: undefined,
                    cssClasses: "",
                    icon: this.configTrack.icon ? this.configTrack.icon : undefined                
                };      
                this.configTrack.suggestedItems.push(listItemJSON);
                if (!this.selectedItemsMap.has(element.value)) {
                    this.configTrack.filteredSuggestedItems.push(listItemJSON);
                }
         });
         if (this.configTrack.sort !== undefined && this.getStringDefault(this.configTrack.sort.order) !== "" && this.getStringDefault(this.configTrack.sort.order) !== "custom" && this.getStringDefault(this.configTrack.sort.field) !== ""){
            if (this.configTrack.sort.order.toLowerCase() === 'asc'){
                this.configTrack.suggestedItems = this.configTrack.suggestedItems.sort(this.compareValues(this.configTrack.sort.field, 'asc'));
                this.configTrack.filteredSuggestedItems = this.configTrack.filteredSuggestedItems.sort(this.compareValues(this.configTrack.sort.field, 'asc'));
            } else if (this.configTrack.sort.order.toLowerCase() === 'desc') {
                this.configTrack.suggestedItems = this.configTrack.suggestedItems.sort(this.compareValues(this.configTrack.sort.field, 'desc'));
                this.configTrack.filteredSuggestedItems = this.configTrack.filteredSuggestedItems.sort(this.compareValues(this.configTrack.sort.field, 'desc'));
            }  
        }
    }

    handleInputKeyUp(event) {
        const listItems = this.template.querySelectorAll('[data-type="listitem"]');
        if (this.getKeyCode(event) === 40 
            && this.configTrack.filteredSuggestedItems.length > 0 
            && listItems
            && listItems.length > 0 ) {
                listItems[0].focus();    
        } else {
            let inputText = event.currentTarget.value;
            if (inputText !== undefined && inputText !==null && inputText.length >= this.configTrack.minSearchLength) {
                this.configTrack.filteredSuggestedItems = [];
                if (inputText.length === 0) {
                    this.configTrack.filteredSuggestedItems = [...this.configTrack.suggestedItems];
                    if (this.configTrack.filteredSuggestedItems.length>0) {
                        for (let i = 0; i < this.configTrack.filteredSuggestedItems.length; i++) {
                            if (this.selectedItemsMap.has(this.configTrack.filteredSuggestedItems[i].value)) {
                                this.configTrack.filteredSuggestedItems.splice(i, 1);  
                                if ((i-1) < this.configTrack.filteredSuggestedItems.length) {
                                    i = i - 1;
                                } else {
                                    break;
                                } 
                            }
                        }
                    }
                } else {
                    this.configTrack.filteredSuggestedItems = this.configTrack.suggestedItems.filter(
                    element => element.label.toUpperCase().includes(inputText.toUpperCase()) && !this.selectedItemsMap.has(element.value)
                    );
                }
            }      
        }  
    }

    handleInputFocus(event) {
        this.showList = this.hasFilteredSuggestions;
        this.hadFocus = true;
    }

    handleInputBlur(event) {
        if (this.isListBoxFocussed(document.activeElement) || this.isListBoxFocussed(event.relatedTarget)) {
            this.showList = true;
        } else {
            this.showList = false;
        }
    }

    handleSelection(event) {
        let selectedItemValue = event.currentTarget.dataset.value;
        if (this.configTrack.onSelect && this.configTrack.onSelect.notAllowedToBeSelected && this.configTrack.onSelect.notAllowedToBeSelected.items && this.configTrack.onSelect.notAllowedToBeSelected.items.length>0) {
            if (this.configTrack.onSelect.notAllowedToBeSelected.items.includes(selectedItemValue)) {
                this.messagingForNotAllowed("onSelect");
                return;
            }
        }
        if (this.configTrack.multiSelect && this.configTrack.multiSelect === true) {
            for (let i = 0; i < this.configTrack.filteredSuggestedItems.length; i++) {
                if (this.configTrack.filteredSuggestedItems[i].value === selectedItemValue) {
                    this.errorMessage = undefined;
                    this.selectedItemsMap.set(this.configTrack.filteredSuggestedItems[i].value, this.configTrack.filteredSuggestedItems[i]);
                    this.configTrack.filteredSuggestedItems.splice(i, 1); 
                    if ((i-1) < this.configTrack.filteredSuggestedItems.length) {
                        i = i - 1;
                    } else {
                        break;
                    }                
                }            
            }
        } else {
            this.selectedItemsMap = new Map();
            let suggestedItems = [...this.configTrack.suggestedItems];
            for (let i = 0; i < suggestedItems.length; i++) {
                if (suggestedItems[i].value === selectedItemValue) {
                    this.errorMessage = undefined;
                    this.selectedItemsMap.set(suggestedItems[i].value, suggestedItems[i]);
                    suggestedItems.splice(i, 1);                     
                    break;      
                }            
            }
            let inputText = this.template.querySelector('[data-id="inputElement"]').value;
            this.configTrack.filteredSuggestedItems = [];
            if (inputText.length>0) {
                this.configTrack.filteredSuggestedItems = suggestedItems.filter(element => element.label.toUpperCase().includes(inputText.toUpperCase()));
            } else {
                this.configTrack.filteredSuggestedItems = [...suggestedItems];
            }
        }        
        let inputElement = this.template.querySelector('[data-id="inputElement"]');
        inputElement.focus();
        this.showList = true;   
        if (this.configTrack.onSelect && this.configTrack.onSelect.eventName) {
            this.dispatchEventWithData("onSelect", this.configTrack.onSelect.eventName);
        } 
    }

    //message for notAllowedForSelection or notAllowedForRemoval
    messagingForNotAllowed(eventName) {
        let eventActionType = eventName === "onSelect" ? "notAllowedToBeSelected" : eventName === "onRemove" ? "notAllowedToBeRemoved" : undefined;
        if (eventName && eventActionType) {
            if (this.configTrack[eventName][eventActionType].message && this.configTrack[eventName][eventActionType].message.type && this.configTrack[eventName][eventActionType].message.text) {
                if (this.configTrack[eventName][eventActionType].message.type.toLowerCase()==="field-error") {
                    this.errorMessage = this.configTrack[eventName][eventActionType].message.text;
                } else {
                    this.dispatchEvent(
                        new ShowToastEvent({
                            title: "Error",
                            message: this.configTrack[eventName][eventActionType].message.text,
                            variant: "error",
                            mode: "pester"
                        }),
                    );
                }
            }
        }        
    }

    //jsonArray or semicolon-delimited-labels or comma-delimited-labels or semicolon-delimited-values or comma-delimited-values
    dispatchEventWithData(event, eventName) {
        let data = {
            selectedItems: undefined,
            removedItems: undefined
        };
        if (this.getStringDefault(this.configTrack[event].selectedDataFormat)==="" || this.getStringDefault(this.configTrack[event].selectedDataFormat)==="jsonArray") {
            data.selectedItems = Array.from(this.selectedItemsMap.values());
        } else {
            data.selectedItems = this.formattedReturn(this.configTrack[event].selectedDataFormat,Array.from(this.selectedItemsMap.values()));
        }  
        if (this.getStringDefault(this.configTrack[event].removedDataFormat)==="" || this.getStringDefault(this.configTrack[event].removedDataFormat)==="jsonArray") {
            data.removedItems = this.removedItems;
        } else {
            data.removedItems = this.formattedReturn(this.configTrack[event].removedDataFormat,this.removedItems);
        }      
        this.removedItems = [];
        this.dispatchEvent(new CustomEvent(eventName, { detail: data }));
    }

    formattedReturn(type, jsonArray) {
        let result = "";
        if (type.includes("values")) {
            result = data.map(function(val) {
                return val.value;
            }).join(',');
        } else if (type.includes("labels")) {
            result = data.map(function(val) {
                return val.value;
            }).join(',');
        }
    }

    handleRemoveSelection(event) {
        let removedItemValue = event.currentTarget.dataset.value;
        if (this.configTrack.onRemove && this.configTrack.onRemove.notAllowedToBeRemoved && this.configTrack.onRemove.notAllowedToBeRemoved.items && this.configTrack.onRemove.notAllowedToBeRemoved.items.length>0) {
            if (this.configTrack.onRemove.notAllowedToBeRemoved.items.includes(removedItemValue)) {
                this.messagingForNotAllowed("onRemove");
                return;
            }
        }
        this.removedItems.push(this.selectedItemsMap.get(removedItemValue));
        this.selectedItemsMap.delete(removedItemValue);  
        let inputText = this.template.querySelector('[data-id="inputElement"]').value;
        this.configTrack.filteredSuggestedItems = [];
        if (inputText.length>0) {
            this.configTrack.filteredSuggestedItems = this.configTrack.suggestedItems.filter(element => element.label.toUpperCase().includes(inputText.toUpperCase()));
        } else {
            this.configTrack.filteredSuggestedItems = [...this.configTrack.suggestedItems];
        }
        if (this.configTrack.filteredSuggestedItems.length>0) {
            for (let i = 0; i < this.configTrack.filteredSuggestedItems.length; i++) {
                if (this.selectedItemsMap.has(this.configTrack.filteredSuggestedItems[i].value)) {
                    this.configTrack.filteredSuggestedItems.splice(i, 1);  
                    if ((i-1) < this.configTrack.filteredSuggestedItems.length) {
                        i = i - 1;
                    } else {
                        break;
                    } 
                }
            }
        }  
        if (this.configTrack.onRemove && this.configTrack.onRemove.eventName) {
            this.dispatchEventWithData("onRemove", this.configTrack.onRemove.eventName);
        } 
    }

    handlePillFocus() {
        this.hadFocus = true;
    }

    handleClearAllItems(event) {
        if (event.currentTarget.tagName === 'SPAN') {
            if (this.getKeyCode(event) !== 13) {
                return;
            } else {
                event.preventDefault();
            }
        }
        this.removedItems = [...Array.from(this.selectedItemsMap.values())];
        this.selectedItemsMap = new Map();
        if (this.configTrack.onRemove && this.configTrack.onRemove.notAllowedToBeRemoved && this.configTrack.onRemove.notAllowedToBeRemoved.items && this.configTrack.onRemove.notAllowedToBeRemoved.items.length>0) {
            if (this.configTrack.onRemove.notAllowedToBeRemoved.items && this.configTrack.onRemove.notAllowedToBeRemoved.items.length>0) {
                loop1:
                for (let i = 0; i < this.configTrack.onRemove.notAllowedToBeRemoved.items.length; i++) {
                    loop2:
                    for (let j = 0; j < this.removedItems.length; j++) {
                        if (this.configTrack.onRemove.notAllowedToBeRemoved.items[i] === this.removedItems[j].value) {
                            this.selectedItemsMap.set(this.removedItems[j].value, this.removedItems[j]);
                            this.removedItems.splice(j, 1);
                            break loop2;
                        }
                    }
                }
                this.messagingForNotAllowed("onRemove");
            }
        }
        let inputText = this.template.querySelector('[data-id="inputElement"]').value;
        this.configTrack.filteredSuggestedItems = [];
        if (inputText.length>0) {
            this.configTrack.filteredSuggestedItems = this.configTrack.suggestedItems.filter(element => element.label.toUpperCase().includes(inputText.toUpperCase()));
        } else {
            this.configTrack.filteredSuggestedItems = [...this.configTrack.suggestedItems];
        }
        if (this.configTrack.filteredSuggestedItems.length>0 && this.selectedItemsMap.size>0) {
            for (let i = 0; i < this.configTrack.filteredSuggestedItems.length; i++) {
                if (this.selectedItemsMap.has(this.configTrack.filteredSuggestedItems[i].value)) {
                    this.configTrack.filteredSuggestedItems.splice(i, 1);  
                    if ((i-1) < this.configTrack.filteredSuggestedItems.length) {
                        i = i - 1;
                    } else {
                        break;
                    } 
                }
            }
        } 
        if (this.configTrack.onRemove && this.configTrack.onRemove.eventName) {
            this.dispatchEventWithData("onRemove", this.configTrack.onRemove.eventName);
        } 
        //added as workaround to trigger required validation the first time
        this.hadFocus = true;
        this.triggerRequiredFieldValidation();            
    }

    handleListItemKeyUp(event){
        event.preventDefault();
        event.stopPropagation();
        const listItems = this.template.querySelectorAll('[data-type="listitem"]');
        let currentIndex =  Number(event.currentTarget.dataset.index);
        if(listItems!==undefined){
            if(this.getKeyCode(event)===40){            
                this.showList = true;
                if(listItems[currentIndex+1]!==undefined){
                    listItems[currentIndex+1].focus();
                }                            
            }
            else if(this.getKeyCode(event)===38){
                this.showList = true;
                if(currentIndex===0){
                    let inputElement = this.template.querySelector('[data-id="inputElement"]');
                    inputElement.focus();
                }
                else if(listItems[currentIndex-1]!==undefined){
                    listItems[currentIndex-1].focus();
                }
            }
            else if(this.getKeyCode(event)===13){
                this.handleSelection(event);
            }
            else{
                this.showList = false;
            }
        }
        else{
            this.showList = false;
        }
    }

    handleListItemBlur(event){
        if(this.showList===true){
            let relatedTarget = event.relatedTarget;
            let keepShowingListBox = false;
            if(relatedTarget!==undefined && relatedTarget!==null){
                if((relatedTarget.tagName==='DIV' && (relatedTarget.parentElement!==undefined && relatedTarget.parentElement.tagName === 'LI')) || (relatedTarget.tagName==='INPUT' && relatedTarget.dataset.id==='inputElement') || (relatedTarget.tagName==='UL')){
                    keepShowingListBox = true;
                }
            }
            if(keepShowingListBox===false){
                this.showList = false;
            }
        }
    }

    handleListItemFocus() {
        this.hadFocus = true;
    }

    handleListBoxMouseDown(event){
        event.preventDefault();
    }

    get clearAllItemsAriaLabel() {
        if (this.hasSelections) {
            return 'Clear all filters';
        }
        return 'Clear all filters unavailable';
    }

    get clearAllItemsClasses() {
        let cssClasses = 'slds-float_right slds-p-right_x-small clear-all';
        if (this.hasSelections) {
            cssClasses += ' slds-text-link ';
        }
        else {
            cssClasses += ' slds-text-link_reset clear-all-items-disbled ';
        }
        return cssClasses;
    }


    isListBoxFocussed(relatedTarget) {
        return (
                    (   relatedTarget!==undefined 
                        && relatedTarget!==null
                    ) 
                    &&
                    (
                        (
                            relatedTarget.tagName==='DIV' 
                            && (relatedTarget.parentElement!==undefined 
                            && relatedTarget.parentElement.tagName === 'LI')
                        ) 
                        || 
                        (   relatedTarget.tagName==='INPUT' 
                            && relatedTarget.dataset.id==='inputElement'
                        ) 
                        || 
                        (
                            relatedTarget.tagName==='UL'
                        )
                    )
                );
    }

    getKeyCode(event){
        let keyCode;
        if (event.keyCode !== undefined) {
            keyCode = event.keyCode;
        }
        return keyCode;
    }

    //cast string undefined/null with empty string
    getStringDefault(value) {
        if (value === undefined || value === null) {
            return "";
        }
        return value.toString();
    }

    compareValues(key, order = 'asc') {
        return function innerSort(a, b) {
          if (!a.hasOwnProperty(key) || !b.hasOwnProperty(key)) {
            // property doesn't exist on either object
            return 0;
          }   
          const varA = (typeof a[key] === 'string') ? a[key].toUpperCase() : a[key];
          const varB = (typeof b[key] === 'string') ? b[key].toUpperCase() : b[key];
          let comparison = 0;
          if (varA > varB) {
            comparison = 1;
          } else if (varA < varB) {
            comparison = -1;
          }
          return (
            (order === 'desc') ? (comparison * -1) : comparison
          );
        };

      }

}