/**
 * Dolnath Calendar Sync Middleman
 * Google Apps Script Web App
 *
 * Deployment:
 *   Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Change POST_TOKEN below, and use the same value in the Tampermonkey userscript.
 */
const POST_TOKEN = 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET';

function doPost(e) {
  const params = (e && e.parameter) || {};
  if (params.token !== POST_TOKEN) {
    return ContentService
      .createTextOutput(JSON.stringify({ok:false,error:'unauthorized'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const code = String(params.code || '').toUpperCase().trim();
  const match = /^DOLNATH-(\d+)-(\d{2})-(\d{2})$/.exec(code);
  if (!match) {
    return ContentService
      .createTextOutput(JSON.stringify({ok:false,error:'invalid_code'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 9 || day < 1 || day > 39) {
    return ContentService
      .createTextOutput(JSON.stringify({ok:false,error:'invalid_date'}))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const props = PropertiesService.getScriptProperties();
  props.setProperty('DOLNATH_SYNC_CODE', code);
  props.setProperty('DOLNATH_SYNC_UPDATED', new Date().toISOString());

  return ContentService
    .createTextOutput(JSON.stringify({ok:true,code:code}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const props = PropertiesService.getScriptProperties();
  const code = props.getProperty('DOLNATH_SYNC_CODE') || 'DOLNATH-304-02-14';
  const updated = props.getProperty('DOLNATH_SYNC_UPDATED') || '';
  const payload = {ok:true,code:code,updated:updated};

  // JSONP avoids cross-origin restrictions inside a Google Sites embed.
  const callback = String((e && e.parameter && e.parameter.callback) || '').trim();
  if (/^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback)) {
    return ContentService
      .createTextOutput(callback + '(' + JSON.stringify(payload) + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
