/* 12월 13일 수원 동창 모임 · 초대장 스크립트 */
(function () {
  'use strict';

  var EVENT = {
    title: '12월 13일 수원 동창 모임',
    place: '명성가 수원본점 (경기 수원시 권선구 금호로 154)',
    place2: '삐에스몽테 제빵소 (경기 수원시 권선구 오목천로 149)',
    // 2026-12-13 11:00 KST = 02:00 UTC
    startUTC: '20261213T020000Z',
    endUTC: '20261213T060000Z'
  };

  /* ---------- D-day ---------- */
  function kstParts(d) {
    var t = new Date(d.getTime() + 9 * 3600 * 1000);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate() };
  }

  function renderDDay() {
    var el = document.getElementById('dday');
    if (!el) return;
    var now = kstParts(new Date());
    var today = Date.UTC(now.y, now.m, now.d);
    var target = Date.UTC(2026, 11, 13);
    var diff = Math.round((target - today) / 86400000);
    var text;
    if (diff > 0) text = '함께 만나기까지 D-' + diff;
    else if (diff === 0) text = '바로 오늘, 만나요!';
    else if (diff > -2) text = '즐거운 시간 보냈어요 · D+' + (-diff);
    else text = '함께한 날로부터 D+' + (-diff);
    el.textContent = text;
  }

  /* ---------- toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('show');
    }, 2100);
  }

  /* ---------- copy ---------- */
  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '-1000px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copyText(text, okMsg) {
    var done = function () { toast(okMsg); };
    var fail = function () { toast('복사가 안 되면 길게 눌러 직접 복사해 주세요'); };
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () {
        if (legacyCopy(text)) done(); else fail();
      });
    } else if (legacyCopy(text)) {
      done();
    } else {
      fail();
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-copy]') : null;
    if (!btn) return;
    var label = btn.getAttribute('data-copy-label') || '내용';
    copyText(btn.getAttribute('data-copy'), label + '를 복사했어요');
  });

  /* ---------- ics ---------- */
  function buildICS() {
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lee Jeongim//Suwon Friends 20261213//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:suwon-friends-20261213@invite',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z',
      'DTSTART:' + EVENT.startUTC,
      'DTEND:' + EVENT.endUTC,
      'SUMMARY:' + EVENT.title,
      'LOCATION:' + EVENT.place,
      'DESCRIPTION:' + [
        '초등학교 동창 모임',
        '1차 점심 11:00 ' + EVENT.place,
        '2차 빵과 커피 ' + EVENT.place2 + ' (차로 약 8분)',
        '두 곳 모두 무료 주차',
        '- 이정임 드림'
      ].join('\\n'),
      'BEGIN:VALARM',
      'TRIGGER:-PT0M',
      'ACTION:DISPLAY',
      'DESCRIPTION:' + EVENT.title,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-P1D',
      'ACTION:DISPLAY',
      'DESCRIPTION:내일 ' + EVENT.title,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lines.join('\r\n') + '\r\n';
  }

  function downloadICS() {
    try {
      var blob = new Blob([buildICS()], { type: 'text/calendar;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '1213_suwon_friends.ics';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast('캘린더 파일을 내려받았어요. 열어서 저장해 주세요');
    } catch (e) {
      toast('캘린더 저장이 안 되면 화면을 캡처해 두세요');
    }
  }

  ['icsBtn', 'icsBtn2'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', downloadICS);
  });

  ['copyLinkBtn', 'copyLinkBtn2'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', function () {
      copyText(window.location.href, '초대장 링크를 복사했어요. 친구들에게 보내 주세요');
    });
  });

  /* ---------- reveal on scroll ---------- */
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  renderDDay();
  setInterval(renderDDay, 60 * 1000);
})();
