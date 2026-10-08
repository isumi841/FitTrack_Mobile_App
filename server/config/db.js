const mongoose = require("mongoose");
const dns = require("node:dns");
const net = require("node:net");

const DNS_SERVERS = ["8.8.8.8", "8.8.4.4"];
dns.setServers(DNS_SERVERS);

const mongoResolver = new dns.Resolver();
mongoResolver.setServers(DNS_SERVERS);

function lookupMongoHost(hostname, options, callback) {
  const lookupOptions =
    typeof options === "number" ? { family: options } : options || {};
  const done = typeof options === "function" ? options : callback;

  if (net.isIP(hostname)) {
    const family = net.isIP(hostname);
    if (lookupOptions.all) {
      done(null, [{ address: hostname, family }]);
    } else {
      done(null, hostname, family);
    }
    return;
  }

  if (!hostname.endsWith(".mongodb.net")) {
    dns.lookup(hostname, options, callback);
    return;
  }

  const family = lookupOptions.family === 6 ? 6 : 4;
  const resolve = family === 6 ? mongoResolver.resolve6 : mongoResolver.resolve4;
  resolve.call(mongoResolver, hostname, (error, addresses) => {
    if (error) {
      done(error);
      return;
    }

    if (lookupOptions.all) {
      done(
        null,
        addresses.map((address) => ({ address, family })),
      );
    } else {
      done(null, addresses[0], family);
    }
  });
}

function getMongoTarget(uri) {
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/([^/?]+)(\/[^?]*)?/i);
  if (!match) return { host: "unavailable", database: "unavailable" };

  const authority = match[1];
  const host = authority
    .slice(authority.lastIndexOf("@") + 1)
    .split(",")[0]
    .replace(/:\d+$/, "");
  const database = (match[2] || "").slice(1) || "(not set)";

  return { host, database };
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  const target = uri
    ? getMongoTarget(uri)
    : { host: "unavailable", database: "unavailable" };

  console.log(
    `MongoDB config: MONGO_URI present=${Boolean(uri)} host=${target.host} database=${target.database}`,
  );

  try {
    if (!uri) {
      throw new Error("MONGO_URI is not configured");
    }
    if (target.database !== "fittrack_db") {
      throw new Error("MONGO_URI must select the fittrack_db database");
    }

    await mongoose.connect(uri, {
      lookup: lookupMongoHost,
      serverSelectionTimeoutMS: 15000,
    });
  } catch (error) {
    const code = error.code ? ` code=${error.code}` : "";
    const safeMessage =
      error.message === "MONGO_URI is not configured" ||
      error.message === "MONGO_URI must select the fittrack_db database"
        ? `: ${error.message}`
        : "";
    console.error(
      `MongoDB connection failed: ${error.name}${code}${safeMessage}`,
    );
    throw error;
  }
};

module.exports = connectDB;