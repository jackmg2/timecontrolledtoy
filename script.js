var client;
var startedTime;
var intervalId;
var audio = document.getElementById('audio');
var testTimeout;
var timelineInSeconds = [];

var podcastSource = document.getElementById('podcastSource');
podcastSource.setAttribute('src', audioSource);

audio.load();

audio.onended = function () {
  stop();
};

audio.ontimeupdate = function () {
  if(!audio.paused){
  checkVibration(audio.currentTime);
  }
};

audio.onpause = function () {
  stopAllToys();
};

ConvertTimelineToSeconds();

$("#sctnCalibration").hide();
$("#sctnToys").hide();
$("#sctnPodcast").hide();

$("#btnTestStop").hide();
$("#btnTestReady").hide();

function ConvertTimelineToSeconds() {
  timelineInSeconds = [];
  for (let i = 0; i < timeline.length; i++) {
    let currentTimespan = TimeSpan.Parse(timeline[i].timespan);
    let timeInSeconds = currentTimespan.totalSeconds() + (currentTimespan.milliseconds() / 1000);
    timelineInSeconds.push({ "timespan": timeInSeconds, "vibration": parseFloat(timeline[i].vibration) });
  }
}

function launchTest() {
  $("#btnTestStart").hide();
  $("#btnTestStop").show();
  client._devices.forEach(async function (d) {
    Vibrate(d, 0.4);
    testTimeout = setTimeout(() => stopTest(), 2500);
  });
}

function stopTest() {
  $("#btnTestStart").show();
  $("#btnTestStop").hide();
  $("#btnTestReady").show();
  if (testTimeout) {
    clearTimeout(testTimeout);
  }
  client._devices.forEach(async function (d) {
    Vibrate(d, 0.0);
  });
}

function ready() {
  $("#sctnCalibration").hide();
  $("#sctnPodcast").show();
}

function checkVibration(currentTimeInSeconds) {
  if (timeline.length > 0 && timelineInSeconds) {
    var progression = timelineInSeconds.filter((i) => i.timespan <= currentTimeInSeconds);
    if (progression && progression.length > 0) {
      progression = progression[progression.length - 1];
      let vibration = progression.vibration;
      client._devices.forEach(async function (d) {
        Vibrate(d, vibration);
      });
    }
  }
}

function Vibrate(device, power) {
  client.SendDeviceMessage(device, device.SendVibrateCmd(power));
}

function stopAllToys() {
  client._devices.forEach(async function (d) {
    Vibrate(d, 0.0);
  });
}

function generateDeviceLi(device) {
  let li = document.createElement("li");
  li.appendChild(document.createTextNode(device.Name));
  return li;
}

let connectToys = async (connectAddress) => {
  if (connectAddress == 'debug') {
    ButtplugDevTools.CreateLoggerPanel(Buttplug.ButtplugLogger.Logger);
    client = await ButtplugDevTools.CreateDevToolsClient(Buttplug.ButtplugLogger.Logger);
    ButtplugDevTools.CreateDeviceManagerPanel(client.Connector.Server);
  }
  else {
    client = new Buttplug.ButtplugClient("Tutorial Client");
  }
  let ul = $('#yourdevices');
  ul.empty();

  client.addListener('deviceadded', async (device) => {
    $("#button-enterRoom").prop("disabled", false);
    li = generateDeviceLi(device);

    ul.append(li);
    await client.StopScanning();
    $("#sctnSync").hide();
    $("#sctnToys").show();
    $("#sctnCalibration").show();
  });

  try {
    if (connectAddress !== undefined && connectAddress !== 'debug') {
      const connector = new Buttplug.ButtplugBrowserWebsocketClientConnector("wss://localhost:12345/buttplug");
      await client.Connect(connector);
    }
    else if (connectAddress == 'debug') {

    }
    else {
      const connector = new Buttplug.ButtplugEmbeddedClientConnector();
      await client.Connect(connector);
    }
  } catch (e) {
    console.log(e);
    return;
  }

  await client.StartScanning();


}