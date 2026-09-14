import fs from "fs";
import os from "os";
import path from "path";

export type Config = {
  dbUrl: string;
  currentUserName?: string;
};

function getConfigFilePath(): string {
  return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
  const configFilePath = getConfigFilePath();

  const rawConfig = {
    db_url: cfg.dbUrl,
    current_user_name: cfg.currentUserName,
  };

  const json = JSON.stringify(rawConfig, null, 2);

  fs.writeFileSync(configFilePath, json, "utf-8");
}

function validateConfig(rawConfig: any): Config {
  if (typeof rawConfig !== "object" || rawConfig === null) {
    throw new Error("Invalid config");
  }

  if (typeof rawConfig.db_url !== "string") {
    throw new Error("Invalid config");
  }

  const config: Config = {
    dbUrl: rawConfig.db_url,
  };

  if (typeof rawConfig.current_user_name === "string") {
    config.currentUserName = rawConfig.current_user_name;
  }

  return config;
}

export function readConfig(): Config {
  const configFilePath = getConfigFilePath();

  const fileContents = fs.readFileSync(configFilePath, "utf-8");

  const rawConfig = JSON.parse(fileContents);

  return validateConfig(rawConfig);
}

export function setUser(userName: string): void {
  const config = readConfig();

  config.currentUserName = userName;

  writeConfig(config);
}
