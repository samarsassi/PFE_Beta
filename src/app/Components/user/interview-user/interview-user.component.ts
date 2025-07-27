import { Component, ElementRef, ViewChild } from '@angular/core';


import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

function randomID(len:number) {
  let result = '';
  if (result) return result;
  var chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP',
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

export function getUrlParams(
  url = window.location.href
) {
  let urlStr = url.split('?')[1];
  return new URLSearchParams(urlStr);
}

@Component({
  selector: 'app-interview-user',
  templateUrl: './interview-user.component.html',
  styleUrls: ['./interview-user.component.css']
})
export class InterviewUserComponent

{
  @ViewChild('root')
  root!: ElementRef;

  ngAfterViewInit() {
    const roomID = getUrlParams().get('roomID') || randomID(5);

    // generate Kit Token
    const appID = 591667673;
    const serverSecret = "43f6a8d22a15d8a6465dd4c1ad7a53a7";
    const kitToken =  ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID,  randomID(5),  randomID(5));

    
    // Create instance object from Kit Token.
    const zp = ZegoUIKitPrebuilt.create(kitToken);

 
    // Start a call.
    zp.joinRoom({
        container: this.root.nativeElement,
        sharedLinks: [
          {
            name: 'Personal link',
            url:
              window.location.protocol + '//' + 
              window.location.host + window.location.pathname +
              '?roomID=' +
              roomID,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
    });
  }
}
