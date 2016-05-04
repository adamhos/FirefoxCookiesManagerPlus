Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

let self = this,
		coomanPlus = {};

function $(id)
{
	return document.getElementById(id);
}
var changesLog = {
	addon: null,
	PREF_BRANCH: coomanPlusCore.PREF_BRANCH,
	GUID: coomanPlusCore.GUID,
	pref: null,
	_copyIssueUrl: 0,
	decode: function(t)
	{
		t = t.toString();
		let r = "";
		for(let i = 0; i < t.length; i += 2)
		{
			r += String.fromCharCode(parseInt(t.substr(i, 2), 16));
		}
		return r;
	},

	mouseOver: function(e)
	{
		changesLog.statusText(e.target.getAttribute("link"));
	},

	mouseOut: function(e)
	{
		changesLog.statusText("");
	},

	statusText: function(txt)
	{
		let status = "XULBrowserWindow" in changesLog.rootWin ? changesLog.rootWin.XULBrowserWindow : null;

		if (status)
		{
			status.overLink = txt;
			try
			{
				rootWin.LinkTargetDisplay.update();
			}
			catch(e)
			{
				status.updateStatusField();
			}
		}
		else
		{
			status = changesLog.rootDoc.getElementById("statusText");
			if (!status)
				return;

			status.setAttribute("label", txt);
		}
	},

	copyMenu: function(e)
	{
		changesLog.copy(document.popupNode.hasAttribute("linkCopy") ? document.popupNode.getAttribute("linkCopy") : document.popupNode.getAttribute("link"));
	},

	copy: function(txt)
	{
		Cc["@mozilla.org/widget/clipboardhelper;1"]
			.getService(Ci.nsIClipboardHelper)
			.copyString(txt);

		changesLog.copy.timer = changesLog.async(function()
		{
			changesLog.statusText(changesLog._("copied") + ": " + txt);
			changesLog.copy.timer = changesLog.async(function()
			{
				changesLog.statusText("");
			}, 5000, changesLog.copy.timer);
		}, 500, changesLog.copy.timer);
	},

	async: function(callback, time, timer)
	{
		if (timer)
			timer.cancel();
		else
			timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);

		timer.init({observe:function()
		{
			callback();
		}}, time || 0, timer.TYPE_ONE_SHOT);
		return timer;
	},//async()

	context: function(e)
	{
		let sel = window.getSelection();
		if (e.originalTarget.id == "changesLogCopy")
		{
			if (sel.rangeCount > 0)
			{
//				let txt = sel.getRangeAt(0).toString();
				let txt = sel.toString();
				if (this._copyIssueUrl && ISSUESSITE)
				{
					txt = txt.replace(/([ ,])(#([0-9]+))/g, function(a, b, c, d)
					{
						return a + " (" + ISSUESSITE + d + ")";
					});
				}
				changesLog.copy(txt);
			}
		}
		else if (e.originalTarget.id == "changesLogCopyLink")
		{
			changesLog.copy(document.popupNode.hasAttribute("linkCopy") ? document.popupNode.getAttribute("linkCopy") : document.popupNode.getAttribute("link"));
		}
		else if (e.originalTarget.id == "changesLogSelectAll")
		{
			sel.removeAllRanges();
			$("changesLog").focus();
			sel.selectAllChildren($("changesLog"));
		}
	},

	popup: function(e)
	{
		let txt = window.getSelection().toString(),
				link = document.popupNode.hasAttribute("linkCopy") ? document.popupNode.getAttribute("linkCopy") : document.popupNode.getAttribute("link");
		if (txt)
			$("changesLogCopy").removeAttribute("disabled");
		else
			$("changesLogCopy").setAttribute("disabled", true);

		$("changesLogCopy").collapsed = !txt && link;
		$("changesLogCopyLink").collapsed = !link;
	},

	highlight: function(e)
	{
		let val = Number($("changesLogHightlight").getAttribute("value"))+1;
		if (val > 2 || val < 0)
			val = 0;
		$("changesLogHightlight").setAttribute("value", val);
		this.showHighlight();
	},

	showHighlight: function()
	{
		let c = $("changesLogHightlight");
		let val = Number(c.getAttribute("value"));
		if (val == 1)
		{
			c.setAttribute("checked", true);
			c.setAttribute("indeterminate", true);
		}
		else if (val == 2)
		{
			c.setAttribute("checked", true);
			c.removeAttribute("indeterminate");
		}
		else
		{
			c.removeAttribute("checked");
			c.removeAttribute("indeterminate");
		}
		$("changesLog").setAttribute("highlight", val)
	},

	legend: function(e)
	{
		let val = Number($("changesLogLegend").getAttribute("value"))+1;
		if (val > 1 || val < 0)
			val = 0;
		$("changesLogLegend").setAttribute("value", val);
		this.showLegend();
	},

	showLegend: function()
	{
		let c = $("changesLogLegend");
		let val = Number(c.getAttribute("value"));
		if (val == 1)
			c.setAttribute("checked", true);
		else
			c.removeAttribute("checked");

		$("changesLog").setAttribute("legend", val)
	},

	wrap: function(e)
	{
		let val = Number($("changesLogWrap").getAttribute("value"))+1;
		if (val > 1 || val < 0)
			val = 0;

		$("changesLogWrap").setAttribute("value", val);
		this.showWrap();
	},

	showWrap: function()
	{
		let c = $("changesLogWrap"),
				b = $("changesLog");
		let val = Number(c.getAttribute("value"));
		if (val == 1)
		{
			c.setAttribute("checked", true);
			b.setAttribute("flex", 1);
			b.parentNode.setAttribute("flex", 1);
		}
		else
		{
			c.removeAttribute("checked");
			b.setAttribute("flex", 0);
			b.parentNode.setAttribute("flex", 0);
		}
		$("changesLog").setAttribute("wrap", val)
		this.onResize();
	},

	altbg: function(e)
	{
		let val = Number($("changesLogAltBg").getAttribute("value"))+1;
		if (val > 1 || val < 0)
			val = 0;

		$("changesLogAltBg").setAttribute("value", val);
		this.showAltbg();
	},

	showAltbg: function()
	{
		let c = $("changesLogAltBg"),
				b = $("changesLog");
		let val = Number(c.getAttribute("value"));
		if (val == 1)
		{
			c.setAttribute("checked", true);
		}
		else
		{
			c.removeAttribute("checked");
		}
		$("changesLog").setAttribute("altbg", val)
		this.onResize();
	},

	copyIssueUrl: function(e)
	{
		let val = Number($("changesLogCopyIssueUrl").getAttribute("value"))+1;
		if (val > 1 || val < 0)
			val = 0;
		$("changesLogCopyIssueUrl").setAttribute("value", val);
		this.showCopyIssueUrl();
	},

	showCopyIssueUrl: function()
	{
		let c = $("changesLogCopyIssueUrl");
		let val = Number(c.getAttribute("value"));
		if (val == 1)
			c.setAttribute("checked", true);
		else
			c.removeAttribute("checked");

		this._copyIssueUrl = val;
	},

	openOptions: function()
	{
		coomanPlusCore.openCMP();
//		Services.wm.getMostRecentWindow('navigator:browser').BrowserOpenAddonsMgr("addons://detail/" + changesLog.addon.id + "/preferences");
	},

	onResize: function ()
	{
		let hbox = document.getElementsByAttribute("line", ""),
				height = $("changesLogFirst");
		if (!height)
			return;

		height = height.firstChild.boxObject.height;
		for(let i = 0; i < hbox.length; i++)
		{
			if (hbox[i].boxObject.height - height > height / 2)
				hbox[i].setAttribute("wrapped", "");
			else
				hbox[i].removeAttribute("wrapped")
		}
	},

	onload: function()
	{
		AddonManager.getAddonByID(changesLog.GUID, function(addon)
		{
			Services.scriptloader.loadSubScript(addon.getResourceURI("chrome/content/constants.js").spec, self);
			changesLog.addon = addon;
			changesLog.init();
		});
	},

	RegExpEscape: function(string)
	{
		return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
	},

	getPrefs: function(type)
	{
		let l = this.pref.getChildList(""),
				r = {};
		l.sort();
		for each (let i in l)
		{
			if (/^template/.test(i))
				continue;

			switch(this.pref.getPrefType(i))
			{
				case Ci.nsIPrefBranch.PREF_BOOL:
					r[i] = this.pref.getBoolPref(i);
					break;
				case Ci.nsIPrefBranch.PREF_INT:
					r[i] = this.pref.getIntPref(i);
					break;
				case Ci.nsIPrefBranch.PREF_STRING:
					r[i] = this.pref.getComplexValue(i, Ci.nsISupportsString).data;
					if (/^template/.test(i))
						r[i] = r[i].replace(/\s{2,}/g, " ");
					break;
			}
		}
		if (type)
			return r;
		else
		{
			l = [];
			for (let i in r)
				l.push(i + ": " + r[i]);

			return l.join("\n");
		}
	},

	fixUrl: function(url)
	{
		let tags = {
					OS: encodeURIComponent(Services.appinfo.OS + " (" + Services.appinfo.XPCOMABI + ")"),
					VER: encodeURIComponent(this.addon.version),
					APP: encodeURIComponent(Services.appinfo.name + " v" + Services.appinfo.version),
					EMAIL: escape(this.decode(EMAIL)),
					EMAILRAW: this.decode(EMAIL),
					NAME: encodeURIComponent(this.addon.name),
					NAMERAW: this.addon.name,
					LOCALE: encodeURIComponent(Cc["@mozilla.org/chrome/chrome-registry;1"].getService(Ci.nsIXULChromeRegistry).getSelectedLocale("global")),
					PREFS: encodeURIComponent(this.getPrefs()),
					PREFSSERIALIZE: encodeURIComponent(JSON.stringify(this.getPrefs(true)))
				}
		let reg = new RegExp("\{([A-Z]+)\}", "gm");
		url = url.replace(reg, function(a, b, c, d)
		{
			if (b in tags)
				return tags[b];
			return a;
		});
		return url;
	}, //fixUrl()

	init: function()
	{
		this.pref = Services.prefs.getBranch(this.PREF_BRANCH);
		let changesLogObj = $("changesLog"),
				aURL = this.addon.getResourceURI("changes.txt").spec,
				utf8Converter = Cc["@mozilla.org/intl/utf8converterservice;1"]
													.getService(Ci.nsIUTF8ConverterService),
				ioService = Cc["@mozilla.org/network/io-service;1"]
											.getService(Ci.nsIIOService),
				scriptableStream = Cc["@mozilla.org/scriptableinputstream;1"]
											.getService(Ci.nsIScriptableInputStream),
				channel,
				array,
				title,
				isChangesLog = window.location.href.indexOf("changes.xul") != -1,
				strings = Cc["@mozilla.org/intl/stringbundle;1"]
										.getService(Ci.nsIStringBundleService)
										.createBundle("chrome://" + ADDONDOMAIN + "/locale/changesLog.properties"),
				_ = function(s)
				{
					try
					{
						return strings.GetStringFromName(s);
					}
					catch(e)
					{
						log.error(e,{callerIndex: 1});
					}
				};
		try //WHAT THE FUCK, MOZILLA?! HOW ABOUT YOU UPDATE THE DAMN DOCUMENTATION BEFORE YOU REMOVE SHIT WITHOUT BACKWARDS COMPATIBILITY?
		{
			channel = ioService.newChannel2(aURL,null,null,
																			null,      // aLoadingNode
																			Services.scriptSecurityManager.getSystemPrincipal(),
																			null,      // aTriggeringPrincipal
																			Ci.nsILoadInfo.SEC_NORMAL,
																			Ci.nsIContentPolicy.TYPE_INTERNAL_IMAGE
			);
		}
		catch(e)
		{
			channel = ioService.newChannel(aURL,null,null);
		}
		this._ = _;
		this.rootWin =  window.QueryInterface(Ci.nsIInterfaceRequestor)
												.getInterface(Ci.nsIWebNavigation)
												.QueryInterface(Ci.nsIDocShellTreeItem)
												.rootTreeItem
												.QueryInterface(Ci.nsIInterfaceRequestor)
												.getInterface(Ci.nsIDOMWindow);
		this.rootDoc = this.rootWin.document;
		if ($("changeLogAddonOptions"))
		{
			$("changeLogAddonOptions").label = this.addon.name;
		}
		if ($("changesLogTitle"))
		{
			document.title = this.addon.name + " " + $("changesLogTitle").value;
			$("changesLogTitle").value = document.title;
		}
		if ($("changesLogCopyLink"))
		{
			$("changesLogCopyLink").setAttribute("label", _("menu_copy_url"));
			$("changesLogCopyLink").setAttribute("accesskey", _("menu_copy_url_key"));
			$("changesLogLinkCopy").setAttribute("label", _("menu_copy_url"));
		}
		let sup = $("supportSite");
		sup.setAttribute("href", SUPPORTSITE);
		sup.setAttribute("link", SUPPORTSITE);
		sup.setAttribute("tooltiptext", SUPPORTSITE);
		sup = $("supportHomepage");
		sup.setAttribute("href", HOMEPAGE);
		sup.setAttribute("link", HOMEPAGE);
		sup.setAttribute("tooltiptext", HOMEPAGE);
		sup = $("supportEmail");
//		sup.setAttribute("href", this.fixUrl("mailto:{NAME} support<{EMAIL}>?subject={NAME}+support&body=%0A%0A_______%0AAddon:+{NAME}+v{VER}%0AOS:+{OS}%0AApp:+{APP}"));
		sup.setAttribute("link", this.fixUrl("{EMAIL}"));
		sup.setAttribute("linkCopy", this.fixUrl("{NAMERAW} support<{EMAILRAW}>"));
		sup.setAttribute("tooltiptext", this.fixUrl("{EMAIL}"));
		function promptExtList (e)
		{
			if (e.button == 2)
				return;

			if (e.target.hasAttribute("href"))
			{
				e.target.removeAttribute("href");
				return false;
			}
			else
			{
				let href = changesLog.fixUrl("mailto:{NAME} support<{EMAIL}>?subject={NAME}&body=%0A%0A__________%0A [Extension]%0A{NAME} v{VER}%0A%0A [Program]%0A{APP} ({LOCALE})%0A%0A [OS]%0A{OS}%0A%0A [Preferences]%0A{PREFSSERIALIZE}"),
						promptService = Cc["@mozilla.org/embedcomp/prompt-service;1"].getService(Ci.nsIPromptService),
						isClipboard = {value: false}
						button = promptService.confirmEx(window,
											_("addExtensionsTitle"),
											_("addExtensions"),
											promptService.BUTTON_POS_0 * promptService.BUTTON_TITLE_IS_STRING + promptService.BUTTON_POS_1 * promptService.BUTTON_TITLE_IS_STRING + promptService.BUTTON_POS_2 * promptService.BUTTON_TITLE_IS_STRING + promptService.BUTTON_POS_2_DEFAULT,
											_("infoLevel0"),
											_("infoLevel2"),
											_("infoLevel1"),
											_("infoClipboard"),
											isClipboard);
				function callback(list)
				{
					let addons = {extension:[],theme:[],plugin:[]};
					for(let i in list)
					{
						if (list[i].isActive)
						{
							if (!addons[list[i].type])
								addons[list[i].type] = []

							addons[list[i].type].push(list[i].name + " v" + list[i].version + " " + list[i].id.replace("@", "{a}"));
						}
					}
					list = "";
					for(let i in addons)
					{
						addons[i].sort();
						let t = addons[i].join("\n");
						if (t)
							list += "\n\n [" + i.charAt(0).toUpperCase() + i.slice(1) + (addons[i].length > 1 ? "s" : "") + "]\n" + t;
					}
					if (list)
						href += encodeURIComponent(list);

					if (Cc["@mozilla.org/xpcom/version-comparator;1"]
							.getService(Ci.nsIVersionComparator)
							.compare(coomanPlusCore.appInfo.version, "8.0") < 0)
					{
						let aURI = Cc["@mozilla.org/network/io-service;1"]
										.getService(Ci.nsIIOService)
										.newURI(href, null, null);
						Cc["@mozilla.org/messengercompose;1"]
							.getService(Ci.nsIMsgComposeService)
							.OpenComposeWindowWithURI(null, aURI);
					}
					else
					{
						e.target.setAttribute("href", href);
						try
						{
							e.target.dispatchEvent(new window.MouseEvent('click', {
								'view': window,
								'bubbles': false,
								'cancelable': true
							}));
						}
						catch(err)
						{
							let evt = document.createEvent("MouseEvents");
							evt.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null)
							e.target.dispatchEvent(evt);
						}
					}
				}
log(button);
				if (button)
					callback([]);
				else
					AddonManager.getAllAddons(callback);

			}
			e.stopPropagation();
			e.preventDefault();
		}
		sup.addEventListener("click", promptExtList, false);
		if (!isChangesLog)
			return;

		changesLogObj.setAttribute("highlight", $("changesLogHightlight").getAttribute("value"));
		changesLogObj.setAttribute("wrap", $("changesLogWrap").getAttribute("value"));
		let input = channel.open();
		scriptableStream.init(input);
		let str = scriptableStream.read(input.available());
		scriptableStream.close();
		input.close();
		str = utf8Converter.convertURISpecToUTF8 (str, "UTF-8");
		str = str.replace(/\t/g, "  ");
		title = str.substr(0, str.indexOf("\n"));
		str = str.replace(title, "").replace(/^\s+/g, "");
		array = str.split("\n");
		let prevhbox = null,
				prevhboxTitle = null,
				isLegend = true,
				legendBox = null,
				stats = {};
		function showStats(stats)
		{
			let first = true,
					hboxStats = document.createElement("hbox");

			hboxStats.className = "stats";
			for(let i in stats)
			{
				let hbox = document.createElement("hbox"),
						type = document.createElement("description"),
						value = document.createElement("description");
				type.className = i;
				type.appendChild(document.createTextNode(stats[i][0]));
				value.appendChild(document.createTextNode("" + stats[i][1] + ", "))
				hbox.appendChild(type);
				hbox.appendChild(value);
				hbox.setAttribute("line", "");
				hbox.className = i;
				hboxStats.appendChild(hbox);
			}
			return hboxStats;
		}

		let oddEven = 1;
		for(let i = 0; i < array.length; i++)
		{
			let t = /^(\s*)([+\-*!])/.exec(array[i]),
					tab = document.createElement("description"),
					type = document.createElement("description"),
					label = document.createElement("description"),
					hbox = document.createElement("hbox"),
					vbox = document.createElement("vbox"),
					space = document.createElement("description"),
					txt = 0;
			if (i > 0)
				changesLogObj.appendChild(document.createTextNode("\n"));

			vbox.className = "text";
			hbox.setAttribute("flex", 0);
			vbox.setAttribute("flex", 1);
			type.className = "type";
			tab.className = "tab";
			space.textContent = " ";
			if (t)
			{
				tab.textContent = t[1];
				type.textContent = t[2];
				let s = "";
				switch(t[2])
				{
					case "+":
						s = "added";
						break;
					case "-":
						s = "removed";
						break;
					case "!":
						s = "fixed";
						break;
					case "*":
						s = "changed";
						break;
				}
				if (s)
				{
					if (typeof(stats[s]) == "undefined")
						stats[s] = [t[2], 0];

					stats[s][1]++;
//						tab.className = s;
					type.className += " " + s;
					hbox.className = s;
					hbox.setAttribute("oddeven", oddEven++ % 2); 
				}
				hbox.appendChild(tab);
				hbox.appendChild(type);
				hbox.appendChild(space);
				txt = t[1].length + 1;
				if (t[1])
				{
					type.className += " border";
					tab.className += " border";
					label.className += " border";
				}
			}
			else if (array[i].match(/^v[0-9]+/))
			{
				if (isLegend)
				{
					hbox.id = "changesLogFirst";
					if (legendBox)
						legendBox.className += " border";
				}

				isLegend = false;
				if (prevhboxTitle)
					prevhboxTitle.insertBefore(showStats(stats), prevhboxTitle.lastChild);

				prevhboxTitle = label;
				if (prevhbox)
				{
					prevhbox.className += " last";
					hbox.className = "titlelog";
				}
				else
				{
					prevhbox = true;
					hbox.className = "titlelog";
				}
				stats = {};
			}
			if (array[i].length > 1 && prevhbox !== null)
				prevhbox = hbox;

			if (isLegend)
			{
				hbox.className += " legend";
				legendBox = hbox;
			}
			else
				hbox.setAttribute("line", "");

			let line = array[i].substr(txt).trim(),
					listIssue = [],
					regIssue = /(^|[\s,.;:\(])(#([0-9]+))/g,
					issue,
					list = [];

			while(issue = regIssue.exec(line))
				listIssue.push(issue);

			if (ISSUESSITE && listIssue.length)
			{
				let start = 0;
				for(let i = 0; i < listIssue.length; i++)
				{
					let part = listIssue[i],
							end = part.index + part[1].length,
							text = line.substring(start, end),
							ll;
					start = end + part[2].length;
					list.push(text);
					ll = document.createElement("label");
					ll.setAttribute("link", ISSUESSITE + part[3]);
					ll.setAttribute("href", ISSUESSITE + part[3]);
					ll.setAttribute("tooltiptext", ISSUESSITE + part[3]);
					ll.addEventListener("mouseover", changesLog.mouseOver, true);
					ll.addEventListener("mouseout", changesLog.mouseOut, true);
					ll.className = "text-link link issue";
					ll.textContent = part[2];
					list.push(ll);
				}
				list.push(line.substr(start));
			}
			else
				list.push(line);
//				label.textContent = line;

			for(let i = 0; i < list.length; i++)
			{
				let list2 = [];
				if (typeof(list[i]) == "object")
					list2.push(list[i]);
				else
				{
					let line = list[i],
							listSetting = [],
							regSetting = new RegExp("(" + this.RegExpEscape(this.PREF_BRANCH) + "[a-z0-9_\\-.]*)", "gi"),
							setting;

					while(setting = regSetting.exec(line))
						listSetting.push({type: "config", data: setting});

					regSetting = new RegExp("(\\(?(?:(?:https?|ftp):\/\/)((?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?)\\)?)", "gi");
					while(setting = regSetting.exec(line))
						listSetting.push({type: "url", data: setting});

					if (listSetting.length)
					{
						let start = 0;
						for(let i = 0; i < listSetting.length; i++)
						{
							let part = listSetting[i].data,
									type = listSetting[i].type,
									end = part.index,
									text,
									url,
									urlText,
									link,
									c = "",
									ll = document.createElement("label");
							switch(type)
							{
								case "config":
									url = part[1];
									urlText = url;
									link = "about:config?filter=" + url;
									text = line.substring(start, end);
									start = end + url.length;
									ll.addEventListener("click", function(e)
									{
										if (e.button == 2)
											return;

										let win = null;
										try
										{
											win = window.open(link);
										}
										catch(e)
										{
											if (coomanPlus.getOpenURL)
												win = coomanPlus.getOpenURL(link, true);
										}
										if (!win)
											return;
e.stopPropagation();
e.preventDefault();
										function setFilter(e)
										{
											win.document.getElementById("textbox").value = url;
										}
										if (win.document.readyState == "complete")
											setFilter()
										else
											win.addEventListener("load", function(e)
											{
												setFilter(e);
											}, false);
									}, true);

									c = " setting";
									break;
								case "url":
									url = part[1];
									urlText = part[2];
									if (url.substr(0, 1) == "(")
									{
										url = url.substr(1);
										end++;
									}
									if (url.substr(-1, 1) == ")")
									{
										url = url.substr(0, url.length - 1);
										urlText = urlText.substr(0, urlText.length - 1);
									}
									link = url;
									text = line.substring(start, end);
									start = end + url.length;
									ll.setAttribute("href", link);
									break;
							}
							list2.push(document.createTextNode(text));
							ll.setAttribute("link", link);
							ll.addEventListener("mouseover", changesLog.mouseOver, true);
							ll.addEventListener("mouseout", changesLog.mouseOut, true);
							ll.className = "text-link link" + c;
							ll.textContent = urlText;
							list2.push(ll);
						}
						list2.push(document.createTextNode(line.substr(start)));
					}
					else
					{
						list2.push(document.createTextNode(list[i]));
					}
				}
				for(let i = 0; i < list2.length; i++)
				{
					label.appendChild(list2[i]);
				}
			}
			label.appendChild(document.createTextNode("\n"));
			vbox.appendChild(label)
			hbox.appendChild(vbox);
			changesLogObj.appendChild(hbox);
		}
		if (prevhboxTitle)
			prevhboxTitle.insertBefore(showStats(stats), prevhboxTitle.lastChild);

		changesLogObj.selectionStart = 0;
		changesLogObj.selectionEnd = 0;
		if (!("arguments" in window) || !window.arguments)
			document.documentElement._buttons.accept.hidden = true;
		else
		{
			document.documentElement.boxObject.lastChild.insertBefore($("changesLogSupport"), document.documentElement.boxObject.lastChild.firstChild);
			$("changesLogTitle").parentNode.setAttribute("align", "center");
			$("changesLogBox").setAttribute("window", true);
		}

		this.showLegend();
		this.showHighlight();
		this.showWrap();
		this.showAltbg();
		this.showCopyIssueUrl();
		window.addEventListener("resize", this.onResize, true);
	} //init()
};
	
