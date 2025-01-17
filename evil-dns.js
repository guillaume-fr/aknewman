var dns = require('dns'),
	net = require('net'),
	dnsLookup = dns.lookup,
	domains = [];

/**
 * Override core DNS lookup function
 * 
 * form https://github.com/JamesHight/node-evil-dns
 * Original license:
 * 
 Copyright 2013 James Hight

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 * 
 * 
 * Modified to handle NodeJS 20+ and resolve ak staging
 **/
dns.lookup = function (domain, options, callback) {
	var i;

	if (arguments.length === 2) {
		callback = options;
		options = {};
	}

	var family = (typeof (options) === 'object') ? options.family : options;
	if (family) {
		family = +family;
		if (family !== 4 && family !== 6) {
			throw new Error('invalid argument: `family` must be 4 or 6');
		}
	}

	for (i = 0; i < domains.length; i++) {
		var entry = domains[i];
		if (domain.match(entry.domain)) {
			if (entry.staging) {
				return dns.resolveCname(domain, (err, addresses) => {
					if (err) {
						return callback(err);
					} else {
						const akaProductionDomains = [".edgekey.net", ".edgesuite.net", ".akamai.net", ".akamaiedge.net"]
						const edgeAddresses = addresses.filter(adr => akaProductionDomains.some(prdHost => adr.endsWith(prdHost)));
						if (edgeAddresses.length > 0) {
							const stagingAddress = edgeAddresses[0].replace(/\.net$/, "-staging.net");
							return dnsLookup.call(this, stagingAddress, options, callback);
						} else {
							return dnsLookup.call(this, domain, options, callback);
						}
					}
				});
			}

			if (!family || family === entry.family) {
				if (options.all) {
					return callback(null, [{ address: entry.ip, family: entry.family }]);
				} else {
					return callback(null, entry.ip, entry.family);
				}
			}
		}
	}

	return dnsLookup.call(this, domain, options, callback);
};

/**
 * Add a domain to the override list
 *
 * @param domain String or RegExp matching domain
 * @param ip String IPv4 or IPv6
 **/

function add(domain, ip) {
	var entry = { ip: ip };

	if (entry.ip === "staging") {
		entry.staging = true;
	} else if (net.isIPv4(entry.ip)) {
		entry.family = 4;
	}
	else if (net.isIPv6(entry.ip)) {
		entry.family = 6;
	}
	else {
		throw new Error('Invalid ip: ' + entry.ip);
	}

	if (domain instanceof RegExp) {
		entry.source = domain;
		entry.domain = domain;
	}
	else {
		entry.source = domain;
		entry.domain = createRegex(domain);
	}

	domains.push(entry);
}

/**
 * Remove a domain from the override list
 * 
 * @param domain String or RegExp
 * @param ip String optional, if not set all domains equivalent domain will be removed
 **/
function remove(domain, ip) {
	var i;

	for (i = 0; i < domains.length; i++) {
		if (domain instanceof RegExp) {
			if (domains[i].source instanceof RegExp
				&& domains[i].source.source === domain.source
				&& (!ip || ip === domains[i].ip)) {

				domains.splice(i, 1);
				i--;
			}
		}
		else {
			if (domains[i].source === domain && (!ip || ip === domains[i].ip)) {
				domains.splice(i, 1);
				i--;
			}
		}

	}
}

/**
 * Remove all domains from the override list
 **/
function clear() {
	domains = [];
}

function createRegex(val) {
	if (val === "") {
		return /./;
	}

	var parts = val.split('*'),
		i;

	for (i = 0; i < parts.length; i++) {
		parts[i] = regexEscape(parts[i]);
	}

	val = parts.join('.*');
	val = '^' + val + '$';

	return new RegExp(val, 'i');
}


function regexEscape(val) {
	return val.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = {
	add: add,
	remove: remove,
	clear: clear,
	domains: domains
};
