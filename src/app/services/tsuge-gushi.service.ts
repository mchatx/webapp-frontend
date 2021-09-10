import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TsugeGushiService {

  constructor() { }

//------------------------ TSUGE GUSHI ENCODING------------------------
TGEncoding(input: string): string{
    var output = "";
    var key = "";
    var teethsize = 0;
    var head = 0;

    while (head == 0){
        head = Date.now() % 100;
    }
    
    input = input.replace(/[^\x00-\x7F]+/g, this.SelectiveURIReplacer);
    output = btoa(input);

    key = head.toString();
    
    teethsize = Math.floor(output.length*3.0/4.0);
    for (var i  = 0; i <= head; i++){
        output = output.slice(teethsize) + output.slice(0, teethsize);
    }
    
    for (var i = 0; i <= head; i++){
        if ((/[a-zA-Z]/).test(output[i])){
            key += output[i];
            break;
        }
    }

    for (; key.length < output.length;){
        var TeethLoc = Math.floor(Math.random()*output.length);
        var Halfend = output.slice(TeethLoc);
        output = output.slice(0, TeethLoc);
        key += TeethLoc.toString();
          
        if (Date.now() % 2 == 0){
          key += "~";
        } else {
          key += "|";
        }
  
        key += Halfend[0];
  
          
        Halfend = Halfend.slice(1);
    
        for (var i = 0;((Date.now() % 2 == 0) && (i < 5));i++){
            if (Halfend.length != 0){
                key += Halfend.slice(0,1);
                Halfend = Halfend.slice(1);
            }
            if (key.length > output.length + Halfend.length){
              break;
            }
        }
    
        output += Halfend;
        if (Date.now() % 2 == 0){
            key += "_";
        } else {
            key += "\\";
        }
    
        if (key.length >= output.length){
            break;
        }
    }

    for (var i = 0; ((i < 3) || (Date.now() % 2 != 0)) && (i < key.length/3.0); i++){
        var incision = Math.floor(Math.random()*output.length);
        if (Date.now() % 2 == 0){
            output = output.slice(0, incision) + "~" + output.slice(incision);
        } else {
            output = output.slice(0, incision) + "_" + output.slice(incision);
        }
    }

    output = output + " " + key;
    
    head = Math.floor((Date.now() % 100) * 16.0 / 100.0);
    teethsize = Math.floor(output.length*3.0/4.0);
    for (var i = 0; i <= head; i++){
        output = output.slice(teethsize) + output.slice(0, teethsize);
    }
  
    key = head.toString(16);
    output = key + output;
	
    return (output);
}
    
TGDecoding(input: string): string {
    var teeth = Number.parseInt(input.slice(0, 1), 16);
    input = input.slice(1);

    var teethsize = input.length - Math.floor(input.length*3.0/4.0);
    for (var i = 0; i <= teeth; i++){
        input = input.slice(teethsize) + input.slice(0, teethsize);
    }

    var output = input.split(" ")[0];
    output = output.replace(/~|_/g, "");
    var key = input.split(" ")[1];

    var cutloc = 0;
    for (cutloc = 0; cutloc < key.length; cutloc++){
        if ((/[a-zA-Z]/).test(key[cutloc])){
            break;
        }
    }
    
    teeth = Number.parseInt(key.slice(0,cutloc));
    
    key = "\\" + key.slice(cutloc + 1);
  
    var cutstring = "";
    var cutstring2 = "";
    
    for (var taking = false; key.length > 0;){
        if((key.slice(-1) == "_") || (key.slice(-1) == "\\")) {
            if (cutstring == ""){
              cutloc = 0
            } else {
              cutloc = Number.parseInt(cutstring);
            }
            output = output.slice(0, cutloc) + cutstring2 + output.slice(cutloc);
            cutstring = "";
            cutstring2 = "";
            taking = false;
        } else if ((key.slice(-1) == "~") || (key.slice(-1) == "|")) {
            taking = true;
        } else if (taking){
            cutstring = key.slice(-1) + cutstring;
        } else {
            cutstring2 = key.slice(-1) + cutstring2;
        }
        key = key.slice(0, key.length - 1);
    }

    teethsize = output.length - Math.floor(output.length*3.0/4.0);
    for (var i = 0; i <= teeth; i++){
        output = output.slice(teethsize) + output.slice(0, teethsize);
    }
	
	output = atob(output);
    output = decodeURI(output);
    
    return (output);
}

SelectiveURIReplacer(match: string): string{
    return(encodeURI(match));
}
//======================== TSUGE GUSHI ENCODING ========================
}
