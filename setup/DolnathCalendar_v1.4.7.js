/*
 * Dolnath Calendar
 * Roll20 Mod / API Script
 * Version 1.4.7
 *
 * Custom Donjon-compatible fantasy calendar tracker.
 * Calendar: 351 days, 9 x 39-day months, 6-day week, 3 moons.
 */

var DolnathCalendar = DolnathCalendar || (function () {
    'use strict';

    var SCRIPT = 'Dolnath Calendar';
    var VERSION = '1.4.7';
    var STATE_KEY = 'ARRUSTAR_FANTASY_CALENDAR';

    var CONFIG = {
        yearLength: 351,
        months: ['Dumue','Vepha','Muriel','Zaliel','Ulsum','Aros','Heimlen','Torren','Nelaser'],
        monthLength: 39,
        weekdays: ['Durnen','Makoten','Vierden','Torgen','Relgun','Fiergen'],
        firstDay: 5,
        moons: {
            Xania:   { cycle: 15, shift: 8 },
            Luistea: { cycle: 39, shift: 7 },
            Vugeon:  { cycle: 31, shift: 0 }
        },
        defaultDate: { year: 304, month: 2, day: 14 },
        weekdayAnchorDate: { year: 304, month: 1, day: 1 },
        upcomingDefault: 7
    };

    var FIXED_EVENTS = [
        {
            month: 'Vepha', day: 4,
            name: 'All Spirits Festival', type: 'Holiday',
            description: 'Observed each year on the fourth day of Vepha, when Spring has settled firmly upon the land and the year has begun to stir with new promises.\n\nWould-be lovers exchange gifts to appease the ancestors of their families and seek a blessing for their union.\n\nThe holiday is commonly associated with courtship, family approval, remembrance, and the belief that the dead still retain an interest in the lives and marriages of their descendants. Gifts may be exchanged not only between prospective partners, but also offered symbolically to deceased relatives whose favor is being sought.'
        },
        {
            month: 'Ulsum', day: 17,
            name: 'Cosmos Accord Day', type: 'Holiday',
            description: 'Observed each year on the seventeenth day of Ulsum, when all three moons are called into perfect fullness in remembrance of the God Chosens’ victory over Ataxia.\n\nCosmos Accord Day was established on the first anniversary of the God Chosens’ victory over Ataxia.\n\nOn this day, Xania, Luistea, and Vugeon all become supernaturally Full, regardless of where they should naturally stand in their lunar cycles. The event is therefore both a historical commemoration and a celestial phenomenon unlike any naturally occurring alignment.\n\nThe simultaneous fullness of all three moons is traditionally regarded as a visible reminder of the accord that followed the victory and of the forces that were brought together to overcome Ataxia.',
            lunarOverride: { Xania: 'Full', Luistea: 'Full', Vugeon: 'Full' }
        },
        {
            month: 'Heimlen', day: 7,
            name: "Autumn's Gate", type: 'Holiday / Season Change',
            description: 'Autumn’s Gate is opened each year on the seventh day of Heimlen, when the warmth of Summer is formally surrendered and the realm turns toward the coming cold.\n\nMarks the formal beginning of Autumn.\n\nHomes, shops, temples, and city gates are decorated with red, orange, and gold leaves. The holiday focuses on transition, preparation, and completing unfinished business before Winter.\n\nDebts are traditionally settled, apprentices may complete periods of training, contracts are renewed, and families begin preparing their homes and stores for colder weather. Travelers returning from long journeys are particularly welcomed on Autumn’s Gate, while beginning an unnecessarily dangerous journey on this day is sometimes considered tempting fate.'
        },
        {
            month: 'Torren', day: 5,
            name: 'First Ember', type: 'Holiday / Season Change',
            description: 'First Ember is kindled each year on the fifth day of Torren, when Winter takes hold and every household prepares to carry its own flame through the cold months ahead.\n\nMarks the beginning of Winter.\n\nAt sunset, every household extinguishes its hearth and kindles a new flame of its own. The relighting is treated as a private household rite, symbolizing endurance, renewal, and the preservation of warmth through the cold season.\n\nFamilies commonly gather around the newly lit hearth for their first winter meal. Allowing the flame to die before sunrise is considered a bad omen for the coming Winter.'
        }
    ];

    var VEILNIGHT = {
        month: 'Zaliel',
        week: 4,
        weekday: 'Torgen',
        duration: 3,
        name: 'Veilnight',
        type: 'Holiday / Supernatural Convergence',
        description: 'Veilnight begins when Torgen arrives in the fourth week of Zaliel and endures for three nights, as the unseen paths between worlds draw dangerously near.\n\nVeilnight is a three-night supernatural observance during which the boundaries separating the planes become unusually thin. Summoning and conjuration magic becomes more potent and reliable, extradimensional passages answer more readily, and beings from beyond the mortal world find it easier to cross into it.\n\nThe phenomenon strengthens over the first two nights before beginning to recede on the third.',
        phases: [
            {
                name: 'The Unsealing',
                description: 'When Torgen falls within the fourth week of Zaliel, Veilnight begins and the first unseen paths between the planes start to open.\n\nPlanar boundaries begin to loosen, and summoning and conjuration magic becomes noticeably easier and more reliable.\n\nCalled creatures arrive more readily, extradimensional passages answer with less resistance, and spirit-calling requires less effort. Experienced mages often describe the first night as a sensation of distant places becoming suddenly close enough to touch.\n\nThe Unsealing is generally considered the safest of the three nights, though even then practitioners are warned that not every answering presence was necessarily the one being called.'
            },
            {
                name: 'The Nearing',
                description: 'On the night that follows, the worlds draw nearest to one another and Veilnight reaches the height of its power.\n\nThe boundaries between planes are at their weakest.\n\nSummoned creatures tend to arrive readily and remain unusually stable, while conjuration, planar travel, extradimensional effects, and spirit-calling reach their greatest potency.\n\nThe ease of crossing works in both directions. Unwanted entities may discover paths into the mortal world without invitation, and places already touched by planar magic can become unpredictable.\n\nFor this reason, the Nearing is prized by ambitious conjurers and feared by those responsible for protecting settlements from supernatural threats.'
            },
            {
                name: 'The Severing',
                description: 'On the third and final night, the distant realms begin to withdraw, and the opened paths slowly close with the coming dawn.\n\nThe boundaries between worlds begin tightening once more, though summoning and conjuration remain unusually effective throughout the night.\n\nTradition warns that creatures summoned during Veilnight should be dismissed before the final dawn. Stories tell of beings that remained too long becoming trapped, altered, or finding ways to remain in the mortal world after the paths behind them had closed.\n\nBy sunrise, the planes are believed to have returned to their ordinary distance from one another.'
            }
        ]
    };

    var SEASONS = [
        { name: 'Spring', month: 'Dumue', day: 5 },
        { name: 'Summer', month: 'Muriel', day: 25 },
        { name: 'Autumn', month: 'Heimlen', day: 7 },
        { name: 'Winter', month: 'Torren', day: 5 }
    ];

    function getState() {
        if (!state[STATE_KEY]) {
            state[STATE_KEY] = {
                version: VERSION,
                date: clone(CONFIG.defaultDate),
                announceUpcoming: CONFIG.upcomingDefault
            };
        } else if (state[STATE_KEY].version !== VERSION) {
            // v1.4.0 updates canonical holiday, Veilnight, and lunar-event descriptions.
            // Preserve campaign date and lunar alignment during upgrades.
            state[STATE_KEY].version = VERSION;
            if (!state[STATE_KEY].date || !validateDate(state[STATE_KEY].date)) {
                state[STATE_KEY].date = clone(CONFIG.defaultDate);
            }
            if (!state[STATE_KEY].announceUpcoming) {
                state[STATE_KEY].announceUpcoming = CONFIG.upcomingDefault;
            }
        }
        return state[STATE_KEY];
    }

    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function esc(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }
    function monthIndex(name) { return CONFIG.months.indexOf(name); }
    function ordinal(n) {
        var v=n%100; return n + (v>=11 && v<=13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n%10] || 'th'));
    }
    function dateText(d) { return ordinal(d.day) + ' of ' + CONFIG.months[d.month-1] + ', ' + d.year; }

    function validateDate(d) {
        return d && Number.isInteger(d.year) && Number.isInteger(d.month) && Number.isInteger(d.day) &&
            d.year >= 1 && d.month >= 1 && d.month <= CONFIG.months.length && d.day >= 1 && d.day <= CONFIG.monthLength;
    }

    function dayOfYear(d) { return (d.month - 1) * CONFIG.monthLength + (d.day - 1); }
    function absoluteDay(d) { return (d.year - 1) * CONFIG.yearLength + dayOfYear(d); }

    function lunarOffset(d) {
        // Lunar shifts are anchored to the campaign's configured current-date epoch.
        return absoluteDay(d) - absoluteDay(CONFIG.defaultDate);
    }

    function weekdayOffset(d) {
        // Keep Donjon weekday alignment anchored to 1 Dumue, 304 even when the campaign current date changes.
        return absoluteDay(d) - absoluteDay(CONFIG.weekdayAnchorDate);
    }

    function weekday(d) {
        var idx = ((CONFIG.firstDay + weekdayOffset(d)) % CONFIG.weekdays.length + CONFIG.weekdays.length) % CONFIG.weekdays.length;
        return CONFIG.weekdays[idx];
    }

    function addDays(d, amount) {
        var a = absoluteDay(d) + amount;
        if (a < 0) { a = 0; }
        var year = Math.floor(a / CONFIG.yearLength) + 1;
        var doy = a % CONFIG.yearLength;
        var month = Math.floor(doy / CONFIG.monthLength) + 1;
        var day = (doy % CONFIG.monthLength) + 1;
        return { year: year, month: month, day: day };
    }

    function daysBetween(a,b) { return absoluteDay(b) - absoluteDay(a); }

    function seasonFor(d) {
        var doy = dayOfYear(d);
        var starts = SEASONS.map(function(s){
            return { name:s.name, doy: monthIndex(s.month) * CONFIG.monthLength + (s.day-1) };
        }).sort(function(a,b){return a.doy-b.doy;});
        var current = starts[starts.length-1].name;
        starts.forEach(function(s){ if (doy >= s.doy) { current=s.name; } });
        return current;
    }

    function phaseFor(name, d) {
        // Donjon-style cycle/shift converted to one of eight named phases.
        // The shift is applied relative to 14 Vepha, 304, the campaign's lunar epoch.
        var m = CONFIG.moons[name];
        var pos = ((lunarOffset(d) + m.shift) % m.cycle + m.cycle) % m.cycle;
        var f = pos / m.cycle;
        var idx = Math.floor((f * 8) + 0.5) % 8;
        return ['New','Waxing Crescent','First Quarter','Waxing Gibbous','Full','Waning Gibbous','Last Quarter','Waning Crescent'][idx];
    }

    function moonPhases(d) {
        var p = {
            Xania: phaseFor('Xania',d),
            Luistea: phaseFor('Luistea',d),
            Vugeon: phaseFor('Vugeon',d)
        };
        var fixed = fixedEventsOn(d);
        fixed.forEach(function(e){
            if(e.lunarOverride) {
                Object.keys(e.lunarOverride).forEach(function(k){ p[k]=e.lunarOverride[k]; });
            }
        });
        return p;
    }

    function fixedEventsOn(d) {
        var m = CONFIG.months[d.month-1];
        return FIXED_EVENTS.filter(function(e){return e.month===m && e.day===d.day;});
    }

    function weekdayName(d) {
        var delta = absoluteDay(d) - absoluteDay(CONFIG.weekdayAnchorDate);
        var idx = ((CONFIG.firstDay + delta) % CONFIG.weekdays.length + CONFIG.weekdays.length) % CONFIG.weekdays.length;
        return CONFIG.weekdays[idx];
    }

    function weekdayInMonthWeek(year, monthName, weekNumber, weekday) {
        var m = monthIndex(monthName) + 1;
        if (m < 1) { return null; }
        var start = ((weekNumber - 1) * CONFIG.weekdays.length) + 1;
        var end = Math.min(start + CONFIG.weekdays.length - 1, CONFIG.monthLength);
        for (var day = start; day <= end; day++) {
            if (weekdayName({year: year, month: m, day: day}) === weekday) {
                return day;
            }
        }
        return null;
    }

    function veilnightEventsOn(d) {
        var monthName = CONFIG.months[d.month-1];
        if (monthName !== VEILNIGHT.month) { return []; }
        var startDay = weekdayInMonthWeek(d.year, VEILNIGHT.month, VEILNIGHT.week, VEILNIGHT.weekday);
        if (startDay === null) { return []; }
        var offset = d.day - startDay;
        if (offset < 0 || offset >= VEILNIGHT.duration) { return []; }
        var phase = VEILNIGHT.phases[offset];
        return [{
            name: VEILNIGHT.name + ' — ' + phase.name,
            type: VEILNIGHT.type,
            description: phase.description,
            special: offset === 1 ? 'Veilnight reaches its strongest point tonight.' : ''
        }];
    }

    function lunarEventsOn(d) {
        var p = moonPhases(d);
        var out = [];

        if (p.Vugeon === 'Full' && p.Xania === 'Full') {
            out.push({ name: 'Night of Whispering Moons', type: 'Lunar Event', description: 'The Night of Whispering Moons begins when vast black Vugeon and silver Xania rise together in their fullest splendor, their combined presence dominating the heavens while little red Luistea follows whatever course fate has set for her.\n\nVugeon is the largest of the three moons, a great black sphere whose fullness is most easily recognized by the strange darkness it casts against the stars and the faint halo that often seems to outline its immense form. Beside it hangs Xania, the second-largest moon, gleaming with unmistakable silver light. When the two stand Full together, the contrast between Vugeon’s immense darkness and Xania’s pale radiance creates one of the most striking sights in the night sky.\n\nDuring this alignment, people across the world begin hearing faint whispers from sources they cannot find.\n\nThe voices may seem to come from empty rooms, darkened doorways, wells, standing stones, temple alcoves, forests, or simply from somewhere just beyond the listener’s shoulder. Some hear only a few indistinct syllables, while others receive entire phrases, warnings, names, questions, or instructions.\n\nNo one has ever proven where the whispers originate.\n\nPriests often claim that the Gods are more easily heard while silver Xania shines beside the enormous black face of Vugeon, though even temples disagree over which voices are truly divine. Scholars offer other explanations: wandering spirits, distant planar entities, echoes of forgotten words, or some unknowable interaction between the two moons themselves.\n\nThe uncertainty is part of what makes the night unsettling. A whisper may offer genuine guidance, reveal a hidden truth, speak a dead person’s name, or urge the listener toward something disastrous. Two people standing beside one another may hear completely different messages, and some hear nothing at all.\n\nMany cultures therefore warn against obeying a whisper simply because it appears supernatural. Priests and diviners often record what is heard and wait for corroborating signs before acting upon it.\n\nCertain traditions hold that a true divine whisper never identifies the god who speaks, while any voice that eagerly names itself should be treated with suspicion.\n\nTemples remain open later than usual during the event, and shrines often fill with people hoping for guidance from a patron deity, a departed ancestor, or some power that has remained silent at other times.\n\nThe Night of Whispering Moons is associated with mystery, revelation, temptation, divine uncertainty, and the dangerous desire to believe that an unseen voice was meant specifically for you.' });
        }
        if (p.Vugeon === 'Full' && p.Xania === 'New' && p.Luistea === 'New') {
            out.push({ name: "Vugeon's Hunt", type: 'Lunar Event', description: 'Vugeon’s Hunt begins when Vugeon alone reaches his terrible fullness, the largest moon hanging black and immense above the world while silver Xania and little red Luistea have both withdrawn their light from the heavens.\n\nWith no other moon to challenge him, Vugeon seems impossibly large. His black disc consumes a vast portion of the night sky, visible less by reflected light than by the stars he obscures and the dim, unnatural halo tracing his circumference. Rural traditions often describe such a night by saying that Vugeon has swallowed the heavens.\n\nDuring Vugeon’s Hunt, the natural world becomes unusually dangerous. Wild animals grow more aggressive, territorial, and fearless, while many become noticeably stronger, faster, and more resilient than they normally would be. Even ordinarily timid creatures may attack travelers or settlements if sufficiently provoked.\n\nPredators are particularly affected. Wolves gather into unusually large packs, great cats roam beyond their normal territories, and bears or similar beasts may remain active when they would ordinarily avoid civilization.\n\nDruids and experienced hunters claim that animals are not merely enraged during the Hunt. They are answering some ancient instinct awakened beneath the solitary presence of the great black moon—something older than domestication, roads, walls, or perhaps even civilization itself.\n\nBecause of this, rural communities commonly bring livestock inside fortified enclosures before sunset. Hunters traditionally avoid killing animals unnecessarily during the event, believing that spilling too much wild blood while Vugeon alone watches from above invites the notice of something older and greater than the beasts already roaming the dark.\n\nAdventurers, however, have another reason to venture into the wilderness: exceptionally powerful beasts sometimes appear only during Vugeon’s Hunt, making the event a natural opportunity for rare monster encounters, trophies, magical materials, or legendary hunts.' });
        }
        if (p.Luistea === 'Full' && p.Xania === 'New' && p.Vugeon === 'New') {
            out.push({ name: "Luistea's Bleeding", type: 'Lunar Event', description: 'Luistea’s Bleeding begins when tiny crimson Luistea alone reaches her fullness, burning like a drop of fresh blood against a sky abandoned by black Vugeon and silver Xania.\n\nLuistea is the smallest of the three moons, and on most nights her red light can seem modest beside her greater sisters. When she alone remains Full, however, the absence of the larger moons makes her crimson color impossible to ignore. The small red moon hangs in an otherwise moonless sky like a wound opened in the heavens.\n\nDuring Luistea’s Bleeding, wounds are notoriously difficult to manage. Cuts bleed longer than expected, old injuries may reopen, and even minor wounds are more prone to swelling, corruption, and infection. Healers traditionally avoid unnecessary surgery or bloodletting during the event, while soldiers and hunters treat even small injuries with unusual caution.\n\nPeople preparing for dangerous work often carry extra bandages, antiseptic herbs, or healing draughts when the small red moon is expected to stand alone in her fullness.\n\nIn some cultures, drawing blood intentionally beneath Luistea is considered deeply unlucky. Others believe blood spilled beneath her solitary crimson light gains unusual potency in curses, oaths, sacrifices, or darker forms of magic.\n\nLuistea herself is not necessarily regarded as malevolent. Rather, her lonely red radiance serves as an unavoidable reminder that beneath armor, pride, and strength, all living creatures are made of vulnerable flesh.\n\nThe event is commonly associated with mortality, vulnerability, sacrifice, and the price of violence.' });
        }
        if (p.Xania === 'Full' && p.Luistea === 'New' && p.Vugeon === 'New') {
            out.push({ name: "Xania's Grace", type: 'Lunar Event', description: 'Xania’s Grace descends when silver Xania alone reaches her perfect fullness, shining brightly over a world from which great black Vugeon and little red Luistea have disappeared.\n\nXania is the second-largest of the three moons. Without Vugeon’s enormous dark form or Luistea’s crimson glow competing for the heavens, her clear silvery radiance seems to wash across the entire landscape. Travelers sometimes say shadows appear softer beneath Xania’s solitary light and that even familiar places seem calmer.\n\nXania’s solitary full moon is regarded as an exceptionally favorable sign for health, healing, and recovery. Wounds seem to close more cleanly, fevers may break sooner, and the sick are believed to respond more readily to medicines and restorative magic.\n\nTemples, healers, and apothecaries often schedule difficult treatments for this night when circumstances allow. Recuperating patients may be carried outdoors or placed beside open windows so that Xania’s silver light can fall upon them.\n\nChildren born beneath Xania’s Grace are traditionally considered blessed with strong constitutions, and surviving a serious illness on this night is sometimes interpreted as evidence that Xania herself has extended mercy to the individual.\n\nSome healing temples place polished silver bowls or mirrors where they can catch Xania’s light throughout the night, believing the reflected radiance retains a trace of her blessing until sunrise.\n\nThe event is commonly associated with renewal, mercy, vitality, healing, and second chances.' });
        }
        if (p.Xania === 'New' && p.Luistea === 'New' && p.Vugeon === 'New') {
            out.push({ name: 'True Night', type: 'Lunar Event', description: 'True Night descends when silver Xania, crimson Luistea, and immense black Vugeon all turn their faces from the world, leaving the heavens utterly without a moon.\n\nThe absence of Vugeon is especially disturbing. The largest moon normally occupies such a commanding presence in the heavens that even its darkness is familiar. When Vugeon vanishes alongside silver Xania and red Luistea, the sky seems unnaturally vast and empty.\n\nThere is no silver glow along the roads. No crimson point watches from above. Not even Vugeon’s enormous black silhouette interrupts the stars.\n\nOn True Night, darkness is said to become more than the mere absence of light.\n\nOnce the final trace of moonlight fades, sleepers begin to dream with unnatural intensity—and some of those dreams do not remain confined to sleep.\n\nNightmares may take shape beside the people who dreamed them. A terrified child might awaken to find the thing beneath the bed standing in the room. A veteran may see fallen enemies walking once more. A guilty ruler may hear the voices of those betrayed, while a grieving widow may discover that the figure waiting beyond the window wears a familiar face.\n\nThese manifestations are rarely identical from one person to another. Some appear only to the dreamer, while others can be seen—and sometimes harmed—by anyone nearby. Whether they are illusions, spirits, creatures drawn from some nightmare realm, or fears somehow given temporary flesh remains a matter of bitter debate among scholars and priests.\n\nCommunities prepare carefully when True Night is predicted. Children are often kept in the same room as their families, lamps remain burning in temples until dawn, and those known to suffer recurring nightmares may be watched through the night. In some regions, people deliberately avoid sleep altogether.\n\nOlder traditions warn against speaking aloud of one’s deepest fears in the days before True Night. According to superstition, a nightmare given a name finds the road into the waking world more easily.\n\nSome priests teach that the three moons ordinarily serve as silent sentinels over the sleeping world: Xania’s silver light guarding the body, Luistea’s red eye reminding the soul of mortality, and vast Vugeon standing watch over the wilderness beyond the firelight. On True Night, all three sentinels are absent.\n\nWhether that belief is true or merely another frightened story told beside a lamp, few people willingly sleep beneath a completely moonless sky.\n\nTrue Night is associated with fear, vulnerability, hidden guilt, abandonment, and the terrifyingly thin boundary between imagination and reality.' });
        }
        return out;
    }

    function seasonEventOn(d) {
        var m = CONFIG.months[d.month-1];
        var s = SEASONS.filter(function(x){return x.month===m && x.day===d.day;})[0];
        if (!s) return [];
        // Autumn/Winter already have holiday cards; still report season transition once.
        return [{ name: s.name + ' begins', type: 'Season Change', description: 'The season changes to ' + s.name + '.' }];
    }

    function allEventsOn(d) {
        return fixedEventsOn(d).concat(seasonEventOn(d)).concat(veilnightEventsOn(d)).concat(lunarEventsOn(d));
    }

    function nextEvents(from, count, maxDays) {
        var found=[];
        for(var i=0;i<=maxDays;i++) {
            var d=addDays(from,i);
            var ev=allEventsOn(d);
            ev.forEach(function(e){found.push({date:d,days:i,event:e});});
            if(found.length>=count && i>0) break;
        }
        return found;
    }

    function styleBox(title, body) {
        return '<div style="border:1px solid #1f2d4d;background:#f7f4ea;border-radius:6px;overflow:hidden;font-family:Georgia,serif;">' +
            '<div style="background:#1f2d4d;color:#fff;padding:7px 10px;font-weight:bold;font-size:14px;">'+esc(title)+'</div>' +
            '<div style="padding:9px 10px;color:#222;">'+body+'</div></div>';
    }
    function renderDescription(text) {
        return esc(text || '').replace(/\\n\\n/g, '<br><br>').replace(/\\n/g, '<br>');
    }

    function line(label,value) { return '<div><b>'+esc(label)+':</b> '+value+'</div>'; }
    function button(label,cmd) { return '<a style="background:#1f2d4d;color:white;padding:3px 6px;border-radius:3px;text-decoration:none;display:inline-block;margin:2px;" href="'+cmd+'">'+esc(label)+'</a>'; }

    function send(msg, html, gmOnly) {
        var who = gmOnly ? '/w gm ' : '';
        sendChat(SCRIPT, who + html, null, {noarchive:true});
    }

    function whisperName(msg) {
        var p=getObj('player',msg.playerid);
        var name=p ? p.get('_displayname') : '';
        return String(name||'').replace(/"/g,'');
    }

    function sendVisible(msg, html, visibility) {
        if(String(visibility||'all').toLowerCase()==='self'){
            var name=whisperName(msg);
            if(name){
                sendChat(SCRIPT,'/w "'+name+'" '+html,null,{noarchive:true});
                return;
            }
        }
        sendChat(SCRIPT,html,null,{noarchive:true});
    }

    function detailPromptButton() {
        return button('View Details',
            '!calendar info ?{What information would you like to see?|Current Day,today|Future Events,upcoming|Moons,moons|All Tracked Events,events} ?{Who should see it?|Whisper to me,self|Visible to all players,all}'
        );
    }

    function upcomingPromptButton() {
        return button('Upcoming',
            '!calendar upcoming ?{How many days ahead?|7} ?{Detail level?|Summary only,summary|Full descriptions,details} ?{Who should see it?|Whisper to me,self|Visible to all players,all}'
        );
    }

    function moonsPromptButton() {
        return button('Moons',
            '!calendar moons ?{How many days ahead?|7} ?{Detail level?|Summary only,summary|Full event descriptions,details} ?{Who should see it?|Whisper to me,self|Visible to all players,all}'
        );
    }

    function syncCode(d) {
        function pad2(n){ return (n<10?'0':'')+n; }
        return 'DOLNATH-'+d.year+'-'+pad2(d.month)+'-'+pad2(d.day);
    }

    function syncButton() {
        return button('Sync Web Calendar','!calendar sync');
    }

    function emitSyncBeacon() {
        var code=syncCode(getState().date);
        sendChat(SCRIPT,'/w gm <span style="font-size:9px;color:#777;">[DOLNATH_SYNC:'+esc(code)+']</span>',null,{noarchive:true});
    }

    function showSyncCode(msg) {
        emitSyncBeacon();
        var d=getState().date;
        var code=syncCode(d);
        var body='<div><b>Current Dolnath date:</b> '+esc(dateText(d))+'</div>'+
            '<div style="margin-top:7px;"><b>Web Sync Code</b></div>'+
            '<div style="font-family:monospace;font-size:15px;padding:6px;border:1px solid #777;background:#fff;">'+esc(code)+'</div>'+
            '<div style="margin-top:7px;">Copy this code into the <b>Web Sync</b> field on the Google Sites calendar.</div>';
        sendVisible(msg,styleBox('Web Calendar Sync',body),'self');
    }

    function showCalendar(msg) {
        var d=getState().date, p=moonPhases(d), ev=allEventsOn(d);
        var body = line('Date', esc(dateText(d))) + line('Weekday', esc(weekday(d))) + line('Season', esc(seasonFor(d))) +
            '<hr>'+line('Xania',esc(p.Xania))+line('Luistea',esc(p.Luistea))+line('Vugeon',esc(p.Vugeon));
        if(ev.length) {
            body += '<hr><b>Today</b>';
            ev.forEach(function(e){ body += '<div style="margin-top:5px;"><b>'+esc(e.name)+'</b> <i>('+esc(e.type)+')</i></div>'; });
        }
        body += '<hr>'+button('Next Day','!calendar next')+upcomingPromptButton()+moonsPromptButton()+detailPromptButton()+syncButton();
        send(msg,styleBox('Campaign Calendar',body),false);
    }

    function showTodayDetails(msg,visibility) {
        var d=getState().date, p=moonPhases(d), ev=allEventsOn(d);
        var body=line('Date',esc(dateText(d)))+line('Weekday',esc(weekday(d)))+line('Season',esc(seasonFor(d)))+
            '<hr>'+line('Xania',esc(p.Xania))+line('Luistea',esc(p.Luistea))+line('Vugeon',esc(p.Vugeon));
        if(ev.length){
            body+='<hr><b>Events Today</b>';
            ev.forEach(function(e){
                body+='<div style="margin:7px 0;"><b>'+esc(e.name)+'</b> <i>('+esc(e.type)+')</i><br>'+renderDescription(e.description);
                if(e.special){body+='<br><i>'+esc(e.special)+'</i>';}
                body+='</div>';
            });
        } else {
            body+='<hr>No tracked events today.';
        }
        sendVisible(msg,styleBox('Current Day Details',body),visibility);
    }

    function showMoons(msg,days,visibility,details) {
        days = Math.max(1,Math.min(parseInt(days,10)||CONFIG.upcomingDefault,351));
        var d=getState().date, body='';
        for(var i=0;i<=days;i++){
            var x=addDays(d,i), p=moonPhases(x);
            body += '<div style="margin:7px 0;">' +
                '<b>' + (i===0 ? 'Today' : (i+' day'+(i===1?'':'s')+' ahead')) + '</b> — ' + esc(dateText(x)) + '<br>' +
                '<b>Xania:</b> ' + esc(p.Xania) + ' &nbsp; ' +
                '<b>Luistea:</b> ' + esc(p.Luistea) + ' &nbsp; ' +
                '<b>Vugeon:</b> ' + esc(p.Vugeon);

            var ve=veilnightEventsOn(x);
            if(ve.length){
                body+='<br>';
                ve.forEach(function(e){
                    body+='<b>'+esc(e.name)+'</b>';
                    if(details){
                        body+=' — '+renderDescription(e.description);
                        if(e.special){body+='<br><i>'+esc(e.special)+'</i>';}
                    }
                    body+='<br>';
                });
            }

            var le=lunarEventsOn(x);
            if(le.length){
                body+='<br>';
                le.forEach(function(e){
                    body+='<b>'+esc(e.name)+'</b>';
                    if(details){body+=' — '+renderDescription(e.description);}
                    body+='<br>';
                });
            }

            body += '</div>';
            if(i<days){ body += '<hr>'; }
        }
        sendVisible(msg,styleBox('Moon Phases — Today + '+days+' Days',body),visibility);
    }

    function showUpcoming(msg,days,visibility,details) {
        days = Math.max(1,Math.min(parseInt(days,10)||CONFIG.upcomingDefault,351));
        var d=getState().date, rows=[];
        for(var i=1;i<=days;i++){
            var x=addDays(d,i), ev=allEventsOn(x);
            ev.forEach(function(e){
                var row='<div style="margin:7px 0;"><b>'+esc(e.name)+'</b> — '+esc(dateText(x))+' <i>('+i+' day'+(i===1?'':'s')+')</i>';
                if(details){
                    row+='<br>'+renderDescription(e.description||'');
                    if(e.special){row+='<br><i>'+esc(e.special)+'</i>';}
                }
                row+='</div>';
                rows.push(row);
            });
        }
        sendVisible(msg,styleBox('Upcoming Events — '+days+' Days',rows.length?rows.join(''):'No tracked events in this period.'),visibility);
    }

    function showEvents(msg,visibility) {
        var body='<b>Annual Holidays</b>';
        FIXED_EVENTS.forEach(function(e){
            body+='<div style="margin:9px 0;"><b>'+esc(e.name)+'</b> — '+e.day+' '+esc(e.month)+'<br>'+renderDescription(e.description)+'</div>';
        });
        var veilStart = weekdayInMonthWeek(getState().date.year, VEILNIGHT.month, VEILNIGHT.week, VEILNIGHT.weekday);
        body+='<div style="margin:9px 0;"><b>'+esc(VEILNIGHT.name)+'</b> — '+esc(VEILNIGHT.weekday)+' of the '+VEILNIGHT.week+'th week of '+esc(VEILNIGHT.month);
        if (veilStart !== null) { body+=' ('+veilStart+'–'+(veilStart+VEILNIGHT.duration-1)+' '+esc(VEILNIGHT.month)+' in '+getState().date.year+')'; }
        body+='<br>'+renderDescription(VEILNIGHT.description);
        VEILNIGHT.phases.forEach(function(p){ body+='<br><br><b>'+esc(p.name)+':</b><br>'+renderDescription(p.description); });
        body+='</div><hr><b>Recurring Lunar Events</b>';
        [
            {name:'Night of Whispering Moons', description:'The Night of Whispering Moons begins when vast black Vugeon and silver Xania rise together in their fullest splendor, their combined presence dominating the heavens while little red Luistea follows whatever course fate has set for her.\n\nVugeon is the largest of the three moons, a great black sphere whose fullness is most easily recognized by the strange darkness it casts against the stars and the faint halo that often seems to outline its immense form. Beside it hangs Xania, the second-largest moon, gleaming with unmistakable silver light. When the two stand Full together, the contrast between Vugeon’s immense darkness and Xania’s pale radiance creates one of the most striking sights in the night sky.\n\nDuring this alignment, people across the world begin hearing faint whispers from sources they cannot find.\n\nThe voices may seem to come from empty rooms, darkened doorways, wells, standing stones, temple alcoves, forests, or simply from somewhere just beyond the listener’s shoulder. Some hear only a few indistinct syllables, while others receive entire phrases, warnings, names, questions, or instructions.\n\nNo one has ever proven where the whispers originate.\n\nPriests often claim that the Gods are more easily heard while silver Xania shines beside the enormous black face of Vugeon, though even temples disagree over which voices are truly divine. Scholars offer other explanations: wandering spirits, distant planar entities, echoes of forgotten words, or some unknowable interaction between the two moons themselves.\n\nThe uncertainty is part of what makes the night unsettling. A whisper may offer genuine guidance, reveal a hidden truth, speak a dead person’s name, or urge the listener toward something disastrous. Two people standing beside one another may hear completely different messages, and some hear nothing at all.\n\nMany cultures therefore warn against obeying a whisper simply because it appears supernatural. Priests and diviners often record what is heard and wait for corroborating signs before acting upon it.\n\nCertain traditions hold that a true divine whisper never identifies the god who speaks, while any voice that eagerly names itself should be treated with suspicion.\n\nTemples remain open later than usual during the event, and shrines often fill with people hoping for guidance from a patron deity, a departed ancestor, or some power that has remained silent at other times.\n\nThe Night of Whispering Moons is associated with mystery, revelation, temptation, divine uncertainty, and the dangerous desire to believe that an unseen voice was meant specifically for you.'},
            {name:"Vugeon's Hunt", description:'Vugeon’s Hunt begins when Vugeon alone reaches his terrible fullness, the largest moon hanging black and immense above the world while silver Xania and little red Luistea have both withdrawn their light from the heavens.\n\nWith no other moon to challenge him, Vugeon seems impossibly large. His black disc consumes a vast portion of the night sky, visible less by reflected light than by the stars he obscures and the dim, unnatural halo tracing his circumference. Rural traditions often describe such a night by saying that Vugeon has swallowed the heavens.\n\nDuring Vugeon’s Hunt, the natural world becomes unusually dangerous. Wild animals grow more aggressive, territorial, and fearless, while many become noticeably stronger, faster, and more resilient than they normally would be. Even ordinarily timid creatures may attack travelers or settlements if sufficiently provoked.\n\nPredators are particularly affected. Wolves gather into unusually large packs, great cats roam beyond their normal territories, and bears or similar beasts may remain active when they would ordinarily avoid civilization.\n\nDruids and experienced hunters claim that animals are not merely enraged during the Hunt. They are answering some ancient instinct awakened beneath the solitary presence of the great black moon—something older than domestication, roads, walls, or perhaps even civilization itself.\n\nBecause of this, rural communities commonly bring livestock inside fortified enclosures before sunset. Hunters traditionally avoid killing animals unnecessarily during the event, believing that spilling too much wild blood while Vugeon alone watches from above invites the notice of something older and greater than the beasts already roaming the dark.\n\nAdventurers, however, have another reason to venture into the wilderness: exceptionally powerful beasts sometimes appear only during Vugeon’s Hunt, making the event a natural opportunity for rare monster encounters, trophies, magical materials, or legendary hunts.'},
            {name:"Luistea's Bleeding", description:'Luistea’s Bleeding begins when tiny crimson Luistea alone reaches her fullness, burning like a drop of fresh blood against a sky abandoned by black Vugeon and silver Xania.\n\nLuistea is the smallest of the three moons, and on most nights her red light can seem modest beside her greater sisters. When she alone remains Full, however, the absence of the larger moons makes her crimson color impossible to ignore. The small red moon hangs in an otherwise moonless sky like a wound opened in the heavens.\n\nDuring Luistea’s Bleeding, wounds are notoriously difficult to manage. Cuts bleed longer than expected, old injuries may reopen, and even minor wounds are more prone to swelling, corruption, and infection. Healers traditionally avoid unnecessary surgery or bloodletting during the event, while soldiers and hunters treat even small injuries with unusual caution.\n\nPeople preparing for dangerous work often carry extra bandages, antiseptic herbs, or healing draughts when the small red moon is expected to stand alone in her fullness.\n\nIn some cultures, drawing blood intentionally beneath Luistea is considered deeply unlucky. Others believe blood spilled beneath her solitary crimson light gains unusual potency in curses, oaths, sacrifices, or darker forms of magic.\n\nLuistea herself is not necessarily regarded as malevolent. Rather, her lonely red radiance serves as an unavoidable reminder that beneath armor, pride, and strength, all living creatures are made of vulnerable flesh.\n\nThe event is commonly associated with mortality, vulnerability, sacrifice, and the price of violence.'},
            {name:"Xania's Grace", description:'Xania’s Grace descends when silver Xania alone reaches her perfect fullness, shining brightly over a world from which great black Vugeon and little red Luistea have disappeared.\n\nXania is the second-largest of the three moons. Without Vugeon’s enormous dark form or Luistea’s crimson glow competing for the heavens, her clear silvery radiance seems to wash across the entire landscape. Travelers sometimes say shadows appear softer beneath Xania’s solitary light and that even familiar places seem calmer.\n\nXania’s solitary full moon is regarded as an exceptionally favorable sign for health, healing, and recovery. Wounds seem to close more cleanly, fevers may break sooner, and the sick are believed to respond more readily to medicines and restorative magic.\n\nTemples, healers, and apothecaries often schedule difficult treatments for this night when circumstances allow. Recuperating patients may be carried outdoors or placed beside open windows so that Xania’s silver light can fall upon them.\n\nChildren born beneath Xania’s Grace are traditionally considered blessed with strong constitutions, and surviving a serious illness on this night is sometimes interpreted as evidence that Xania herself has extended mercy to the individual.\n\nSome healing temples place polished silver bowls or mirrors where they can catch Xania’s light throughout the night, believing the reflected radiance retains a trace of her blessing until sunrise.\n\nThe event is commonly associated with renewal, mercy, vitality, healing, and second chances.'},
            {name:'True Night', description:'True Night descends when silver Xania, crimson Luistea, and immense black Vugeon all turn their faces from the world, leaving the heavens utterly without a moon.\n\nThe absence of Vugeon is especially disturbing. The largest moon normally occupies such a commanding presence in the heavens that even its darkness is familiar. When Vugeon vanishes alongside silver Xania and red Luistea, the sky seems unnaturally vast and empty.\n\nThere is no silver glow along the roads. No crimson point watches from above. Not even Vugeon’s enormous black silhouette interrupts the stars.\n\nOn True Night, darkness is said to become more than the mere absence of light.\n\nOnce the final trace of moonlight fades, sleepers begin to dream with unnatural intensity—and some of those dreams do not remain confined to sleep.\n\nNightmares may take shape beside the people who dreamed them. A terrified child might awaken to find the thing beneath the bed standing in the room. A veteran may see fallen enemies walking once more. A guilty ruler may hear the voices of those betrayed, while a grieving widow may discover that the figure waiting beyond the window wears a familiar face.\n\nThese manifestations are rarely identical from one person to another. Some appear only to the dreamer, while others can be seen—and sometimes harmed—by anyone nearby. Whether they are illusions, spirits, creatures drawn from some nightmare realm, or fears somehow given temporary flesh remains a matter of bitter debate among scholars and priests.\n\nCommunities prepare carefully when True Night is predicted. Children are often kept in the same room as their families, lamps remain burning in temples until dawn, and those known to suffer recurring nightmares may be watched through the night. In some regions, people deliberately avoid sleep altogether.\n\nOlder traditions warn against speaking aloud of one’s deepest fears in the days before True Night. According to superstition, a nightmare given a name finds the road into the waking world more easily.\n\nSome priests teach that the three moons ordinarily serve as silent sentinels over the sleeping world: Xania’s silver light guarding the body, Luistea’s red eye reminding the soul of mortality, and vast Vugeon standing watch over the wilderness beyond the firelight. On True Night, all three sentinels are absent.\n\nWhether that belief is true or merely another frightened story told beside a lamp, few people willingly sleep beneath a completely moonless sky.\n\nTrue Night is associated with fear, vulnerability, hidden guilt, abandonment, and the terrifyingly thin boundary between imagination and reality.'}
        ].forEach(function(e){ body+='<div style="margin:9px 0;"><b>'+esc(e.name)+'</b><br>'+renderDescription(e.description)+'</div>'; });
        sendVisible(msg,styleBox('Tracked Calendar Events',body),visibility);
    }


    function announceTodayTomorrow(msg) {
        var today=getState().date, tomorrow=addDays(today,1);
        var todayEvents=allEventsOn(today), tomorrowEvents=allEventsOn(tomorrow);
        if(!todayEvents.length && !tomorrowEvents.length) return;

        var body='';
        if(todayEvents.length){
            body+='<b>Happening Today — '+esc(dateText(today))+'</b>';
            todayEvents.forEach(function(e){body+='<div style="margin:4px 0;"><b>'+esc(e.name)+'</b></div>';});
        }
        if(tomorrowEvents.length){
            if(body) body+='<hr>';
            body+='<b>Coming Tomorrow — '+esc(dateText(tomorrow))+'</b>';
            tomorrowEvents.forEach(function(e){body+='<div style="margin:4px 0;"><b>'+esc(e.name)+'</b></div>';});
        }
        body+='<hr>'+detailPromptButton()+syncButton();
        send(msg,styleBox('Calendar Notice',body),false);
    }

    function advance(msg,days,label) {
        if(!playerIsGM(msg.playerid)) { send(msg,styleBox('Calendar','Only the GM may advance campaign time.'),false); return; }
        days=parseInt(days,10);
        if(!Number.isInteger(days)||days<1||days>3510){send(msg,styleBox('Calendar','Advance must be between 1 and 3510 days.'),false);return;}
        var st=getState(), start=clone(st.date), crossed=[];
        for(var i=1;i<=days;i++){
            var d=addDays(start,i), ev=allEventsOn(d);
            ev.forEach(function(e){crossed.push({date:d,event:e});});
        }
        st.date=addDays(start,days);
        var body=line('Departure',esc(dateText(start)))+line('Arrival',esc(dateText(st.date)))+line('Elapsed',days+' day'+(days===1?'':'s'))+line('Season',esc(seasonFor(st.date)));
        if(crossed.length){body+='<hr><b>Important Events During '+(label==='travel'?'Travel':'Advancement')+'</b>';crossed.forEach(function(x){body+='<div style="margin-top:5px;"><b>'+esc(x.event.name)+'</b> — '+esc(dateText(x.date))+'</div>';});}
        var upcoming=nextEvents(st.date,3,90).filter(function(x){return x.days>0;}).slice(0,3);
        if(upcoming.length){body+='<hr><b>Next Important Events</b>';upcoming.forEach(function(x){body+='<div>'+esc(x.event.name)+' — '+x.days+' day'+(x.days===1?'':'s')+'</div>';});} body+='<hr>'+detailPromptButton()+syncButton();
        send(msg,styleBox(label==='travel'?'Travel Complete':'Calendar Advanced',body),false);
        announceTodayTomorrow(msg);
        emitSyncBeacon();
    }

    function setDate(msg,args) {
        if(!playerIsGM(msg.playerid)){send(msg,styleBox('Calendar','Only the GM may set the date.'),false);return;}
        var year=parseInt(args[0],10), monthArg=args[1], day=parseInt(args[2],10), month=parseInt(monthArg,10);
        if(isNaN(month)){month=CONFIG.months.map(function(x){return x.toLowerCase();}).indexOf(String(monthArg||'').toLowerCase())+1;}
        var d={year:year,month:month,day:day};
        if(!validateDate(d)){send(msg,styleBox('Calendar','Usage: <b>!calendar set YEAR MONTH DAY</b><br>Example: !calendar set 304 Vepha 4'),false);return;}
        getState().date=d; emitSyncBeacon(); showCalendar(msg);
    }

    function reset(msg) {
        if(!playerIsGM(msg.playerid)){send(msg,styleBox('Calendar','Only the GM may reset the calendar.'),false);return;}
        state[STATE_KEY]={version:VERSION,date:clone(CONFIG.defaultDate),announceUpcoming:CONFIG.upcomingDefault};
        emitSyncBeacon();
        showCalendar(msg);
    }


    function showInfo(msg,args) {
        var choice=String(args[0]||'today').toLowerCase();
        var visibility=String(args[1]||'self').toLowerCase();
        switch(choice){
            case 'today': showTodayDetails(msg,visibility); break;
            case 'upcoming': showUpcoming(msg,CONFIG.upcomingDefault,visibility,true); break;
            case 'moons': showMoons(msg,CONFIG.upcomingDefault,visibility,true); break;
            case 'events': showEvents(msg,visibility); break;
            default: showTodayDetails(msg,visibility); break;
        }
    }

    function help(msg) {
        var body = '<div><b>!calendar</b> — show current date</div>'+
            '<div><b>!calendar next</b> — advance one day (GM); automatically announces events happening today or tomorrow</div>'+
            '<div><b>!calendar advance N</b> — advance N days (GM)</div>'+
            '<div><b>!travel N</b> — advance N travel days and report crossed events (GM)</div>'+
            '<div><b>!calendar set YEAR MONTH DAY</b> — set date (GM)</div>'+
            '<div><b>Upcoming button</b> — prompts for days, summary/full descriptions, and private/public visibility</div><div><b>!calendar upcoming N</b> — manual summary for next N days (defaults to 7)</div>'+
            '<div><b>Moons button</b> — prompts for days, summary/full event descriptions, and private/public visibility</div><div><b>!calendar moons N</b> — manual moon summary for today and next N days (defaults to 7)</div>'+
            '<div><b>!calendar events</b> — tracked holidays/events</div>'+
            '<div><b>!calendar info</b> — interactive detail prompt with private/public visibility choice</div>'+
            '<div><b>!calendar sync</b> — whispers the current Web Sync code to you</div>'+
            '<div><b>!calendar reset</b> — reset to 14 Vepha, 304 (GM)</div>'+
            '<hr><div>Calendar: 351 days/year; 9 months of 39 days; 6-day week.</div>';
        send(msg,styleBox(SCRIPT+' v'+VERSION,body),false);
    }

    function handleInput(msg) {
        if(msg.type!=='api') return;
        var content=msg.content.trim();
        if(/^!travel(?:\s|$)/i.test(content)) {
            var t=content.split(/\s+/); advance(msg,t[1], 'travel'); return;
        }
        if(!/^!calendar(?:\s|$)/i.test(content)) return;
        var a=content.split(/\s+/).slice(1), cmd=(a.shift()||'show').toLowerCase();
        switch(cmd){
            case 'show': showCalendar(msg); break;
            case 'next': advance(msg,1,'advance'); break;
            case 'advance': advance(msg,a[0],'advance'); break;
            case 'set': setDate(msg,a); break;
            case 'upcoming': showUpcoming(msg,a[0],a[2]||'all',String(a[1]||'summary').toLowerCase()==='details'); break;
            case 'moons': showMoons(msg,a[0],a[2]||'all',String(a[1]||'summary').toLowerCase()==='details'); break;
            case 'events': showEvents(msg,'all'); break;
            case 'info': showInfo(msg,a); break;
            case 'sync': showSyncCode(msg); break;
            case 'reset': reset(msg); break;
            case 'help': help(msg); break;
            default: help(msg); break;
        }
    }

    function checkInstall() {
        getState();
        log(SCRIPT+' v'+VERSION+' ready.');
    }

    function registerEventHandlers() { on('chat:message',handleInput); }

    return {
        CheckInstall: checkInstall,
        RegisterEventHandlers: registerEventHandlers
    };
}());

on('ready',function(){
    'use strict';
    DolnathCalendar.CheckInstall();
    DolnathCalendar.RegisterEventHandlers();
});
