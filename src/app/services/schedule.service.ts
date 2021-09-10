import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  constructor(private httpclient: HttpClient) { }

  getSchedule(room:string = ""): Observable<any>  {
    if (room == ""){
      return (this.httpclient.get(environment.DBConn + '/Schedule'));      
    } else {
      return (this.httpclient.get(environment.DBConn + '/Schedule?room=' + room));
    }
  }

  getScheduleRoom(room:string): Observable<any>  {
    return (this.httpclient.get(environment.DBConn + '/Schedule/?room=' + room));
  }

  getScheduleLink(link:string): Observable<any>  {
    return (this.httpclient.get(environment.DBConn + '/Schedule/?link=' + link));
  }

  getScheduleTags(tags:string): Observable<any>  {
    return (this.httpclient.get(environment.DBConn + '/Schedule/?tags=' + tags));
  }


  //------------------------------------------- SCHEDULE EDIT HANDLER -------------------------------------------

  // RETURN STRING "OK" WHEN SUCCESS OR HTTP STATUS 400 FOR ERROR
  AddSchedule(room:string, token: string, link: string | undefined, note: string | undefined, tag: string | undefined, time: number): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Schedule/', { 
      Act: 'Add',
      Room: room, 
      Token: token,
      Link: link,
      Note: note,
      Tag: tag,
      Time: time  // THIS ONE SHOULD BE IN miliseconds SINCE UTC FORMAT
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  // RETURN STRING "OK" WHEN SUCCESS OR HTTP STATUS 400 FOR ERROR
  // YOU CAN GET SCHEDULE ID FROM getSchedule WITH ROOM ARGUMENT
  EditSchedule(room:string | undefined, token: string, link: string | undefined, note: string | undefined, tag: string | undefined, idObject: string | undefined, time: number): Observable<any> {
    const headers = {'Content-Type': 'application/json'};
  
    return (this.httpclient.post(environment.DBConn + '/Schedule/', { 
      Act: 'Edit',
      Room: room, 
      Token: token,
      Link: link,
      Note: note,
      Tag: tag,
      Time: time,
      id: idObject
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  // RETURN STRING "OK" WHEN SUCCESS OR HTTP STATUS 400 FOR ERROR
  DeleteSchedule(room:string | undefined, token: string, idObject: string | undefined): Observable<any> {
    const headers = {'Content-Type': 'application/json'};

    return (this.httpclient.post(environment.DBConn + '/Schedule/', { 
      Act: 'Delete',
      Room: room, 
      Token: token,
      id: idObject
    }, { headers, observe: 'response', responseType: 'text'}));
  }

  //=========================================== SCHEDULE EDIT HANDLER ===========================================
}
