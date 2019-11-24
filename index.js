module.exports = function BossHelper(mod) {
	const notifier = mod.require ? mod.require.notifier : require('tera-notifier')(mod)
	const Message = require('../tera-message')
	const MSG = new Message(mod)
	
	let mobid = [],
		boss = null,
		bossName = null,
		sysMsg = null,
		npcID = null,
		bossHunting = 0,
		bossTemplate = 0
	
	mod.command.add(["boss", "bh"], (arg) => {
		if (!arg) {
			mod.settings.enabled = !mod.settings.enabled
			MSG.chat("Boss-Helper " + (mod.settings.enabled ? MSG.BLU(" Вкл. ") : MSG.YEL(" Выкл. ")))
			if (!mod.settings.enabled) {
				for (let i of mobid) {
					despawnItem(i)
				}
			}
		} else {
			switch (arg) {
				case "msg":
					mod.settings.alerted = !mod.settings.alerted
					MSG.chat("alert " + (mod.settings.alerted ? MSG.BLU("Вкл.") : MSG.YEL("Выкл.")))
					break
				case "not":
					mod.settings.notice = !mod.settings.notice
					MSG.chat("notice " + (mod.settings.notice ? MSG.BLU("Вкл.") : MSG.YEL("Выкл.")))
					break
				case "log":
					mod.settings.messager = !mod.settings.messager
					MSG.chat("message log " + (mod.settings.messager ? MSG.BLU("Вкл.") : MSG.YEL("Выкл.")))
					break
				case "marker":
					mod.settings.marker = !mod.settings.marker
					MSG.chat("marker " + (mod.settings.marker ? MSG.BLU("Вкл.") : MSG.YEL("Выкл.")))
					break
				case "clear":
					MSG.chat("Boss-Helper " + TIP("Clear log"))
					for (let i of mobid) {
						despawnItem(i)
					}
					break
				case "upd":
					MSG.chat("Мировые боссы")
					for (const i of mod.settings.bosses) {
						if (i.logTime == undefined) continue
						if (![5001, 501, 4001].includes(i.templateId)) continue
						
						var nextTime = i.logTime + 5*60*60*1000
						if (i.logTime == 0) {
							MSG.chat(MSG.RED(i.name) + MSG.YEL(" Не обнаружен "))
						} else if (Date.now() < nextTime) {
							MSG.chat(MSG.RED(i.name) + " Уничтожен. Ожидаемое появление " + MSG.TIP(getTime(nextTime)))
						} else {
							MSG.chat(MSG.RED(i.name) + " Прошлое появление " + MSG.GRY(getTime(nextTime)))
						}
					}
					// break
				// case "Mys":
					MSG.chat("Тайные торговцы")
					for (const j of mod.settings.bosses) {
						if (j.logTime == undefined) continue
						if (![63, 72, 84, 183].includes(j.huntingZoneId)) continue
						
						var nextTime = j.logTime + 24*60*60*1000
						if (j.logTime == 0) {
							MSG.chat(MSG.PIK(j.name) + MSG.YEL(" Не обнаружен "))
						} else if (Date.now() < nextTime) {
							MSG.chat(MSG.PIK(j.name) + " Ожидаемое появление " + MSG.TIP(getTime(nextTime)))
						} else {
							MSG.chat(MSG.PIK(j.name) + " Прошлое появление " + MSG.GRY(getTime(nextTime)))
						}
					}
					break
				default:
					MSG.chat("Boss-Helper " + MSG.RED("Неправильный параметр!"))
					break
			}
		}
	})
	
	mod.game.me.on('change_zone', (zone, quick) => {
		mobid = []
	})
	
	mod.hook('S_SPAWN_NPC', 11, (event) => {
		if (!mod.settings.enabled) return
		
		whichBoss(event.huntingZoneId, event.templateId)
		if (boss) {
			if (mod.settings.marker) {
				spawnItem(event.gameId, event.loc)
				mobid.push(event.gameId)
			}
			if (mod.settings.alerted) {
				MSG.alert((" Обнаружен " + boss.name), 44)
			}
			if (mod.settings.notice) {
				MSG.raids(" Обнаружен " + boss.name)
			}
		}
		
		if (event.walkSpeed != 240) return;
		
		switch (event.templateId) {
			case 5001: // Ортан
				event.shapeId = 303730;
				event.huntingZoneId = 434;
				event.templateId = 7000;
				load(event);
				return true;
			case 501:  // Хазар				event.shapeId = 303740;
				event.huntingZoneId = 777;
				event.templateId = 77730;
				load(event);
				return true;
			case 4001: // Кэлос
				event.shapeId = 303750;
				event.huntingZoneId = 994;
				event.templateId = 1000;
				load(event);
				return true;
		}
	})
	
	mod.hook('S_DESPAWN_NPC', 3, {order: -100}, (event) => {
		if (!mobid.includes(event.gameId)) return
		
		whichBoss(event.huntingZoneId, event.templateId)
		// if (boss) {
			// if (event.type == 5) {
				// if (mod.settings.alerted) {
					// MSG.alert((boss.name + " Уничтожен "), 44)
				// }
				// if (mod.settings.notice) {
					// MSG.raids(boss.name + " Уничтожен ")
				// }
			// } else if (event.type == 1) {
				// if (mod.settings.alerted) {
					// MSG.alert((boss.name + " Вне зоны атаки"), 44)
				// }
				// if (mod.settings.notice) {
					// MSG.raids(boss.name + " Вне зоны атаки")
				// }
			// }
		// }
		despawnItem(event.gameId)
		mobid.splice(mobid.indexOf(event.gameId), 1)
	})
	
	mod.hook('S_SYSTEM_MESSAGE', 1, (event) => {
		if (!mod.settings.enabled || !mod.settings.messager) return
		
		sysMsg = mod.parseSystemMessage(event.message)
		switch (sysMsg.id) {
			case 'SMT_FIELDBOSS_APPEAR':
				getBossMsg(sysMsg.tokens.npcName)
				whichBoss(bossHunting, bossTemplate)
				if (boss) {
					MSG.chat(MSG.BLU(" Обнаружен ") + MSG.RED(boss.name))
					notificationafk(" Обнаружен " + boss.name)
				}
				break
			case 'SMT_FIELDBOSS_DIE_GUILD':
			case 'SMT_FIELDBOSS_DIE_NOGUILD':
				getBossMsg(sysMsg.tokens.npcname)
				whichBoss(bossHunting, bossTemplate)
				if (boss) {
					var nextTime = Date.now() + 5*60*60*1000
					MSG.chat(MSG.RED(boss.name) + " Уничтожен. Ожидаемое появление " + MSG.TIP(getTime(nextTime)))
					saveTime()
				}
				break
			
			case 'SMT_WORLDSPAWN_NOTIFY_SPAWN':
				getBossMsg(sysMsg.tokens.npcName)
				whichBoss(bossHunting, bossTemplate)
				if (boss) {
					if ([1276, 1284].includes(bossTemplate)) {
						MSG.party(" Обнаружен " + boss.name)
					} else {
						MSG.chat(MSG.BLU(" Обнаружен ") + MSG.PIK(boss.name))
					}
					notificationafk(" Обнаружен " + boss.name)
					saveTime()
				}
				break
			case 'SMT_WORLDSPAWN_NOTIFY_DESPAWN':
				// getBossMsg(sysMsg.tokens.npcName)
				// whichBoss(bossHunting, bossTemplate)
				// if (boss) {
					// MSG.chat(MSG.PIK(boss.name) + MSG.YEL(" Вне зоны атаки"))
				// }
				break
			default :
				break
		}
	})
	
	function getBossMsg(id) {
		npcID = id.match(/\d+/ig)
		bossHunting  = parseInt(npcID[0])
		bossTemplate = parseInt(npcID[1])
	}
	
	function whichBoss(h_ID, t_ID) {
		if (mod.settings.bosses.find(b => b.huntingZoneId == h_ID && b.templateId == t_ID)) {
			boss = mod.settings.bosses.find(b => b.huntingZoneId == h_ID && b.templateId == t_ID)
		} else {
			boss = null
		}
	}
	
	function saveTime() {
		for (let i=0; i < mod.settings.bosses.length; i++) {
			if (mod.settings.bosses[i].logTime == undefined) continue
			if (mod.settings.bosses[i].huntingZoneId != bossHunting ) continue
			if (mod.settings.bosses[i].templateId != bossTemplate) continue
			
			mod.settings.bosses[i].logTime = Date.now()
		}
	}
	
	function getTime(thisTime) {
		var Time = new Date(thisTime)
		return	add_0(Time.getMonth()+1) + "/" + add_0(Time.getDate()) + " " +
			        add_0(Time.getHours())   + ":" + add_0(Time.getMinutes())
	}
	
	function add_0(i) {
		if (i < 10) {
		        i = "0" + i;
		}
		return i;
	}
	
	function spawnItem(gameId, loc) {
		mod.send('S_SPAWN_DROPITEM', 8, {
			gameId: gameId*10n,
			loc: loc,
			item: mod.settings.itemId,
			amount: 1,
			expiry: 999999
		})
	}
	
	function despawnItem(gameId) {
		mod.send('S_DESPAWN_DROPITEM', 4, {
			gameId: gameId*10n
		})
	}
	
	// BAM-HP-Bar
	let gage_info = {
			id: 0n,
			huntingZoneId: 0,
			templateId: 0,
			target: 0n,
			unk1: 0,
			unk2: 0,
			curHp: 16000000000n,
			maxHp: 16000000000n,
			unk3: 1
		},
		hooks = []
	
	function update_hp() {
		mod.toClient('S_BOSS_GAGE_INFO', 3, gage_info);
	}
	// 0: 0% <= hp < 20%, 1: 20% <= hp < 40%, 2: 40% <= hp < 60%, 3: 60% <= hp < 80%, 4: 80% <= hp < 100%, 5: 100% hp
	function correct_hp(stage) {
		let boss_hp_stage = BigInt(20*(1+stage));
		// we missed some part of the fight?
		if (gage_info.curHp * 100n / gage_info.maxHp > boss_hp_stage) {
			gage_info.curHp = gage_info.maxHp * boss_hp_stage / 100n;
			update_hp();
			mod.command.message('Здоровье босса снижено до <font color="#E69F00">' + String(boss_hp_stage) + '</font>%');
		}
	}
	
	function load(e) {
		gage_info.id = e.gameId;
		gage_info.curHp = gage_info.maxHp;
		correct_hp(e.hpLevel);
		if (e.mode) {
			mod.command.message('Вы пропустили ~ <font color="#E69F00">' + Math.round((99999999 - e.remainingEnrageTime)/1000) + '</font> сек. боя');
		}
		
		if (e.hpLevel == 5) {
			mod.command.message("Здоровье босса полное, никто его еще не атаковал");
		} else if (e.hpLevel == 0) {
			mod.command.message('Здоровье босса ниже <font color="#FF0000">20%</font> !!!');
		}
		
		if (!hooks.length) {
			setTimeout(update_hp, 1000);
			hook('S_NPC_STATUS', 2, (event) => {
				if (event.gameId === gage_info.id) {
					correct_hp(event.hpLevel);
				}
			});
			
			hook('S_EACH_SKILL_RESULT', 14, (event) => {
				if (event.target === gage_info.id && event.type === 1) {
					gage_info.curHp -= event.value;
					update_hp();
				}
			});
			
			hook('S_DESPAWN_NPC', 3, (event) => {
				if (event.gameId === gage_info.id) {
					unload();
				}
			});
		}
	}
	
	function unload() {
		if (hooks.length) {
			for (let h of hooks) {
				mod.unhook(h);
			}
			hooks = []
		}
	}
	
	function hook() {
		hooks.push(mod.hook(...arguments));
	}
	
	function notificationafk(msg, timeout) { // timeout in milsec
		notifier.notifyafk({
			title: 'TERA AFK-Notification',
			message: msg,
			wait: false, 
			sound: 'Notification.IM', 
		}, timeout)
	}
}
