#!/usr/bin/env node

/**
 * Seed Supabase with the sample matchmaking dataset so the real pipeline has
 * something to work with before live data is ingested.
 *
 * Requires the following environment variables (or backend/.env) to be set:
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE_KEY
 *
 * This script is a no-op when the Supabase client is running in stub mode.
 */

const process = require("node:process");
const supabase = require("../auth/services/supabaseClient");
const sampleUsers = require("../matchmaking/data/sampleUsers");

const status =
  typeof supabase.__status === "function" ? supabase.__status() : null;

if (!status || status.usesStub || typeof supabase.from !== "function") {
  console.warn(
    "[seedMatchmakingSample] Supabase client is not configured. " +
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to seed the real database."
  );
  process.exit(0);
}

const { randomUUID } = require("node:crypto");

const toProfileRow = (user, idMap) => {
  const id = idMap.get(user.id);
  return {
    id,
    full_name: user.name,
    email: user.email,
    major: user.major,
    graduation_year: user.graduationYear,
    interests: user.interests || [],
    hobbies: user.hobbies || [],
    classes: user.classes || [],
    bio: user.bio,
    fun_fact: user.funFact,
    favorite_spot: user.favoriteSpot,
    vibe_check: user.vibeCheck,
    is_opted_in: true,
    instagram: user.instagram || null,
  };
};

const toAvailabilityRows = (user, idMap) => {
  const userId = idMap.get(user.id);
  return (user.availability || []).map((slot) => ({
    user_id: userId,
    title: slot.title || "Availability",
    start_time: slot.start,
    end_time: slot.end,
    source: slot.source || "sample-seed",
  }));
};

const seed = async () => {
  console.info(
    "[seedMatchmakingSample] Seeding Supabase with sample matchmaking data"
  );

  const authUsers = new Map();
  if (supabase.auth && supabase.auth.admin && supabase.auth.admin.listUsers) {
    let page = null;
    do {
      const { data, error } = await supabase.auth.admin.listUsers(page || {});
      if (error) {
        console.error(
          "[seedMatchmakingSample] Failed to list Supabase auth users",
          error
        );
        break;
      }

      (data.users || []).forEach((user) => {
        if (user.email) {
          authUsers.set(user.email.toLowerCase(), user);
        }
      });

      page =
        data?.next_page_token || data?.nextPageToken
          ? { page: data.next_page_token || data.nextPageToken }
          : null;
    } while (page);
  }

  const ensureAuthUser = async (user) => {
    const email =
      typeof user.email === "string" ? user.email.toLowerCase() : undefined;
    if (email && authUsers.has(email)) {
      return authUsers.get(email).id;
    }

    if (
      email &&
      supabase.auth &&
      supabase.auth.admin &&
      typeof supabase.auth.admin.createUser === "function"
    ) {
      const password =
        process.env.SUPABASE_SEED_PASSWORD ||
        `SeedPass!${Math.random().toString(36).slice(2, 10)}Aa1`;

      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password,
        email_confirm: true,
        user_metadata: {
          seeded: true,
          name: user.name,
          hobbies: user.hobbies,
          interests: user.interests,
          classes: user.classes,
          instagram: user.instagram,
        },
      });

      if (error) {
        throw error;
      }

      const record = data?.user || data;
      if (record?.email) {
        authUsers.set(record.email.toLowerCase(), record);
      }
      if (!record?.id) {
        throw new Error(
          "[seedMatchmakingSample] Supabase createUser did not return an id"
        );
      }
      return record.id;
    }

    return randomUUID();
  };

  const idMap = new Map();
  for (const user of sampleUsers) {
    const id = await ensureAuthUser(user);
    idMap.set(user.id, id);
  }

  const profileRows = sampleUsers.map((user) => toProfileRow(user, idMap));

  const { error: profileError } = await supabase
    .from("match_profiles")
    .upsert(profileRows, { onConflict: "id" });

  if (profileError) {
    console.error(
      "[seedMatchmakingSample] Failed to upsert match_profiles",
      profileError
    );
    process.exit(1);
  }

  for (const user of sampleUsers) {
    const availabilityRows = toAvailabilityRows(user, idMap);

    const { error: deleteError } = await supabase
      .from("availability_slots")
      .delete()
      .eq(
        "user_id",
        availabilityRows.length
          ? availabilityRows[0].user_id
          : idMap.get(user.id)
      );

    if (deleteError) {
      console.error(
        "[seedMatchmakingSample] Failed to clear availability for",
        user.id,
        deleteError
      );
      process.exit(1);
    }

    if (!availabilityRows.length) continue;

    const { error: insertError } = await supabase
      .from("availability_slots")
      .insert(availabilityRows);

    if (insertError) {
      console.error(
        "[seedMatchmakingSample] Failed to insert availability for",
        user.id,
        insertError
      );
      process.exit(1);
    }
  }

  console.info(
    "[seedMatchmakingSample] Successfully seeded profiles and availability."
  );
  process.exit(0);
};

seed().catch((error) => {
  console.error("[seedMatchmakingSample] Unexpected failure", error);
  process.exit(1);
});
