"use client";

import { useState } from "react";
import { auth } from "@clerk/nextjs/server";

// Settings page is server-rendered for initial data, but uses a client form
export { default } from "./settings-client";
