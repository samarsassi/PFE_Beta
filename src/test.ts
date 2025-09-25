import 'zone.js/testing';

declare const require: any;

// Limit test discovery to only our curated tests folder
const context = require.context('./tests', true, /\.spec\.ts$/);
context.keys().forEach(context);



