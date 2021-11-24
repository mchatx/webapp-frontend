import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timePrinter'
})
export class TimePrinterPipe implements PipeTransform {

  transform(value: number, msOutput: boolean = true, Full: boolean = false): string {
    var MS:string = Math.floor((value % 1)*100).toString();
    if (MS.length == 1){
      MS = "0" + MS;
    }
  
    value = Math.floor(value);
    var H: number = Math.floor(value/60/60);
    value -= H*60*60;
    var M: number = Math.floor(value/60);
    value -= M*60;
  
    var Stemp:string = H.toString() 
    if (Stemp.length == 1){
      Stemp = "0" + Stemp;
    }
    Stemp += ":" + ("0" + M.toString()).slice(-2) + ":" + ("0" + value.toString()).slice(-2) + "." + MS;
  
    if (Full) {
      if (msOutput) {
        return Stemp;
      } else {
        return Stemp.slice(0, Stemp.length - 3);
      }
    } else {
      for (var i = 0; i < 3; i++) {
        if (Stemp.slice(0, 2) != "00"){
          break;
        } else {
          Stemp = Stemp.slice(3);
        }
      }
  
      if (Stemp[0] == '0'){
        Stemp = Stemp.slice(1);
      }
  
      if (msOutput) {
        return Stemp;
      } else {
        return Stemp.slice(0, Stemp.length - 3);
      }
    }
  }
}