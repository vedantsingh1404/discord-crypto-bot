//jshint esversion: 8

process.on('unhandledRejection', error => {
	console.error(error.stack);
});

const request = require('request');
const auth = require('./auth.json');
const discord = require('discord.js');
const cron = require('node-cron');
const fs = require('fs');
const meta = require('./meta.json');


client = new discord.Client();

client.login(auth.token)
  .then(console.log(`Logged in succesfully.`))
  .catch((error) => {
    console.log(error);
  });

client.on('ready', () => {
  console.log(`Successfully logged in as ${client.user.tag}`);
});

client.on('error', (err) => {
	console.log(err);
});

// auto update

var task = cron.schedule('*/5 * * * *', () => {
	var options = {
		"method" : "GET",
		"url" : "https://api.coincap.io/v2/assets?limit=10",
	};

	request(options, (err, res, body) => {
		if(err) {
			console.log(err);
		}
		else {
			data = JSON.parse(body);
			const channel = client.channels.get(`${auth.channel}`);

			channel.send('---------------------------------');

			for(var i = 0;i < 10;i++) {
				curr_data = data.data[i];
				channel.send(`1 ${curr_data.symbol} = ${curr_data.priceUsd} USD`);
			}

			channel.send('---------------------------------');
		}
	});
});

task.start();

// commands

client.on('message', (message) => {
	if(!message.guild) return;

	var args = message.content.split(' ');

	if (message.content.toLowerCase().startsWith('yo')) {
		var cmd = args[1].toLowerCase();

		switch(cmd) {
			case 'symbol' :
				var name_arr = args.slice(2,);
				var name = name_arr.join(' ');

				const index = meta.findIndex((metadata, index) => {
					return metadata.name.toLowerCase() === name.toLowerCase();
				});

				if(index === -1) {
					message.reply(`No such currency found in the database.`);
				} else {

					const symb = meta[index].asset_id;
					message.reply(`The symbol of ${name} is ${symb}`);

				}

				break;

			case 'name' :
				var symb2 = args[2];

				const index2 = meta.findIndex((metadata, index2) => {
					return metadata.asset_id.toLowerCase() === symb2.toLowerCase();
				});

				if(index2 === -1) {
					message.reply(`No such currency found in the database.`);
				} else {
					const name2 = meta[index2].name;

					message.reply(`The name of ${symb2} is ${name2}`);
				}

				break;

			case 'price' :

				var curr1 = args[2].toUpperCase();
				var curr2 = args[3].toUpperCase();

				const index3 = meta.findIndex((metadata, index3) => {
					return metadata.asset_id.toLowerCase() === curr1.toLowerCase();
				});

				const index4 = meta.findIndex((metadata, index4) => {
					return metadata.asset_id.toLowerCase() === curr2.toLowerCase();
				});

				if(index3 === -1 || index4 === -1) {
					message.reply(`Please enter valid currency codes.`);
				} else {
					if(meta[index3].type_is_crypto === 1 && meta[index4].type_is_crypto === 0) {

						var options_price = {
							"method" : "GET",
							"url" : "https://apiv2.bitcoinaverage.com/indices/global/ticker/" + curr1 + curr2
						};

						request(options_price, (err, res, body) => {
							if(err) {
								console.log(err);
							} else {
								var data = JSON.parse(body);

								var rate = data.last;

								message.reply(`1 ${curr1} = ${rate} ${curr2}`);
							}
						});

					} else if (meta[index3].type_is_crypto === 1 && meta[index4].type_is_crypto === 1) {

						var options_price_1 = {
							"method" : "GET",
							"url" : "https://apiv2.bitcoinaverage.com/indices/global/ticker/" + curr1 + "USD"
						};

						request(options_price_1, (err, res, body) => {
							if(err) {
								console.log(err);
							} else {
								data = JSON.parse(body);

								var options_price_2 = {
									"method" : "GET",
									"url" : "https://apiv2.bitcoinaverage.com/indices/global/ticker/" + curr2 + "USD"
								};

								request(options_price_2, (err2, res2, body2) => {
									if(err) {
										console.log(err);
									} else {
										data2 = JSON.parse(body2);

										rate = data.last / data2.last;

										message.reply(`1 ${curr1} = ${rate} ${curr2}`);
									}
								});
							}
						});

					} else if (meta[index3].type_is_crypto === 0 && meta[index4].type_is_crypto === 0) {

						var options_price_1 = {
							"method" : "GET",
							"url" : "https://apiv2.bitcoinaverage.com/indices/global/ticker/BTC" + curr1
						};

						request(options_price_1, (err, res, body) => {
							if(err) {
								console.log(err);
							} else {
								data = JSON.parse(body);

								var options_price_2 = {
									"method" : "GET",
									"url" : "https://apiv2.bitcoinaverage.com/indices/global/ticker/BTC" + curr2
								};

								request(options_price_2, (err2, res2, body2) => {
									if(err) {
										console.log(err);
									} else {
										data2 = JSON.parse(body2);

										rate = data2.last / data.last;

										message.reply(`1 ${curr1} = ${rate} ${curr2}`);
									}
								});
							}
						});

					} else if (meta[index3].type_is_crypto === 0 && meta[index4].type_is_crypto === 1) {

						var options_price = {
							"method" : "GET",
							"url" : "https://apiv2.bitcoinaverage.com/indices/global/ticker/" + curr2 + curr1
						};

						request(options_price, (err, res, body) => {
							if(err) {
								console.log(err);
							} else {
								var data = JSON.parse(body);

								var rate = 1 / data.last;

								message.reply(`1 ${curr1} = ${rate} ${curr2}`);
							}
						});

					}
			}

			break;
		}
	}

});


// logging

var logpath = "discord.log";
fs.appendFileSync(logpath, '\n');
var log = {
	log: function (str) {
		var date = new Date();
		var timestamp = date.toLocaleDateString() + " " + date.toLocaleTimeString() + " - ";
		var line = timestamp + str;
		fs.appendFileSync(logpath, line + '\n');
	},
	channel: function (content, channel) {
		if (channel.guild && channel.guild.muted) return;
		if (channel.guild)
			this.log(`/${channel.guild.id}(${channel.guild.name})/${channel.id}(${channel.name})/${content}`);
		 else
			this.log(`/${channel.id}(DM)/${content}`);
	},
	guild: function (content, guild) {
		if (guild.muted) return;
		this.log(`/${guild.id}(${guild.name})/${content}`);
	},
	client: function (str) {
		this.log(str);
	}
};

client.on('message', (message) => {
  log.channel(`${message.author.tag}/${message.id} : ${message.content}`, message.channel);
});
client.on('messageDelete', (message) => {
  log.channel(`${message.id} has been deleted.`, message,channel);
});
client.on('messageUpdate', (oldMessage, newMessage) => {
  if(oldMessage.content != newMessage.content) {
    log.channel(`${oldMessage.id} has been updated. \nOld message : ${oldMessage.content} \nNew message : ${newMessage.content}`, message.channel);
  }
});
client.on('messageReactionAdd', (messageReaction, user) => {
  log.channel(`${user.id}/${user.tag} has reacted to ${messageReaction.message.id} with reaction ${messageReaction.emoji.name}`, messageReaction.message.channel);
});
client.on('messageReactionRemove', (messageReaction, user) => {
  log.channel(`${user.id}/${user.tag} reaction to ${messageReaction.message} has been removed`, messageReaction.message.channel);
});
client.on('messageReactionRemoveAll', (message) => {
  log.channel(`All reaction to ${message.id} were removed.`);
});

client.on('guildBanAdd', (guild, user) => {
  log.guild(`${user.id}/${user.tag} has been banned.`, guild);
});
client.on('guildBanRemove', (guild, user) => {
  log.guild(`${user.id}/${user.tag} has been unbanned.`, guild);
});
client.on('guildMemberAdd', (member) => {
  log.guild(`${member.user.id}/${member.user.tag} has joined the guild.`, member.guild);
});
client.on('guildMemberAvailable', (member) => {
  log.guild(`${member.user.id}/${member.user.tag} is now available in the guild.`, member.guild);
});
client.on('guildMemberRemove', (member) => {
  log.guild(`${member.user.id}/${member.user.tag} has been removed from the guild.`, member.guild);
});
client.on('guildMemberUpdate', (oldMember, newMember) => {
	if (newMember.nickname !== oldMember.nickname) log.guild(`User ${newMember.user.id} (${newMember.user.tag}) changed their nickname from "${oldMember.nickname || '(none)'}" to "${newMember.nickname || '(none)'}"`, newMember.guild);
	if (newMember.roles !== oldMember.roles) log.guild(`Roles on user ${newMember.user.id} (${newMember.user.tag}) have been updated.`, newMember.guild);
	if (newMember.serverMute !== oldMember.serverMute) log.guild(`User ${newMember.user.id} (${newMember.user.tag}) has been ${newMember.serverMute ? '' : 'un-'}server-muted.`, newMember.guild);
	if (newMember.serverDeaf !== oldMember.serverDeaf) log.guild(`User ${newMember.user.id} (${newMember.user.tag}) has been ${newMember.serverMute ? '' : 'un-'}server-deafened.`, newMember.guild);
});

client.on('emojiCreate', (emoji) => {
  log.guild(`Emoji ${emoji.identifier}/${emoji.id} has been created. \nURL : ${emoji.url}`, emoji.guild);
});
client.on('emojiDelete', (emoji) => {
  log.guild(`Emoji ${emoji.identifier}/${emoji.id} has been deleted.\nURL : ${emoji.url}`, emoji.guild);
});
client.on('emojiUpdate', (oldEmoji, newEmoji) => {
  log.guild(`Emoji ${oldEmoji.identifier} has been updated to ${newEmoji.identifier}`, oldEmoji.guild);
});

client.on('roleCreate', (role) => {
  log.guild(`${role.id}/${role.name} has been created.`, role.guild);
});
client.on('roleDelete', (role) => {
  log.guild(`${role.id}/${role.name} has been deleted.`, role.guild);
});
client.on('roleUpdate', (oldRole, newRole) => {
	if (newRole.name !== oldRole.name) log.guild(`Role ${oldRole.id} (${oldRole.name}) has been renamed to "${newRole.name}"`, newRole.guild);
	if (newRole.color !== oldRole.color) log.guild(`Color of role ${oldRole.id} (${oldRole.name}) has changed from ${oldRole.color} to ${newRole.color}`, newRole.guild);
	if (newRole.position !== oldRole.position) log.guild(`Position of role ${oldRole.id} (${oldRole.name}) changed from ${oldRole.position} to ${newRole.position}`, newRole.guild);
	if (newRole.permissions !== oldRole.perissions) log.guild(`Permissions of role ${oldRole.id} (${oldRole.name}) changed from ${oldRole.permissions} to ${newRole.permissions}`, newRole.guild);
});

client.on('channelCreate', (channel) => {
  log.channel(`Client gained access to channel.`, channel);
});
client.on('channelDelete', (channel) => {
  log.channel(`Client lost access to channel.`, channel);
});
client.on('channelPinsUpdate', (channel) => {
  log.channel(`Pinned messages have been updated.`, channel);
});
client.on('channelUpdate', (oldChannel, newChannel) => {
	if (newChannel.type === "text") {
		if (newChannel.name !== oldChannel.name) log.channel(`Channel renamed from #${oldChannel.name} to #${newChannel.name}`, newChannel);
		if (newChannel.topic !== oldChannel.topic) log.channel(`Topic changed from "${oldChannel.topic}" to "${newChannel.topic}"`, newChannel);
		if (newChannel.nsfw !== oldChannel.nsfw) log.channel(`NSFW mode is now ${newChannel.nsfw ? 'enabled' : 'disabled'}.`, newChannel);
		if (newChannel.permissionOverwrites !== oldChannel.permissionOverwrites) log.channel(`Permissions have been updated.`, newChannel);
		if (newChannel.position !== oldChannel.position) log.channel(`Channel position has changed to ${newChannel.position}`, newChannel);
	}
	if (newChannel.type === "voice") {
		if (newChannel.name !== oldChannel.name) log.channel(`Channel name changed from "${oldChannel.name}" to "${newChannel.name}"`, newChannel);
		if (newChannel.bitrate !== oldChannel.bitrate) log.channel(`Bitrate changed from "${oldChannel.bitrate}" to "${newChannel.bitrate}"`, newChannel)
		if (newChannel.userLimit !== oldChannel.userLimit) log.channel(`User limit changed from "${oldChannel.userLimit}" to "${newChannel.userLimit}"`, newChannel);
		if (newChannel.permissionOverwrites !== oldChannel.permissionOverwrites)  log.channel(`Permissions have been updated.`, newChannel);
	}
});

client.on('guildCreate', (guild) => {
  log.client(`Client joined guild ${guild.id}/${guild.name}`);
});
client.on('guildDelete', (guild) => {
  log.client(`Client left guild ${guild.id}/${guild.name}`);
});
client.on('userUpdate', (oldUser, newUser) => {
	if (newUser.tag !== oldUser.tag) log.client(`User ${newUser.id} changed their username from "${oldUser.tag}" to "${newUser.tag}"`);
	if (newUser.displayAvatarURL !== oldUser.displayAvatarURL) log.client(`User ${newUser.id} (${newUser.tag}) changed their avatar. Old avatar: ${oldUser.displayAvatarURL} New avatar: ${newUser.displayAvatarURL}`);
});
