"use server";

import { z } from "zod";
import { withAction, ActionResult } from "@/lib/action";
import { Team, User } from "@/models";
import { invalidateEntity, CACHE_TAGS } from "@/lib/cache";
import { revalidatePath } from "next/cache";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  description: z.string().optional(),
  companyId: z.string().optional(),
  capacityHoursPerWeek: z.number().default(40),
});

export async function createTeamAction(input: unknown): Promise<ActionResult> {
  return withAction(createTeamSchema, input, async (data) => {
    const team = await Team.create({
      name: data.name,
      description: data.description || "",
      companyId: data.companyId,
      capacityHoursPerWeek: data.capacityHoursPerWeek,
      members: [],
      projectIds: [],
    });

    if (data.companyId) {
      invalidateEntity(CACHE_TAGS.teams());
    }
    revalidatePath("/teams");
    return { id: team._id.toString(), name: team.name };
  });
}

const addMemberSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
  name: z.string().min(1, "Name is required"),
  role: z.string().default("Member"),
  position: z.string().optional(),
  rank: z.string().optional(),
  email: z.string().optional(),
});

export async function addMemberToTeamAction(input: unknown): Promise<ActionResult> {
  return withAction(addMemberSchema, input, async (data) => {
    const user = (await User.create({
      name: data.name,
      role: data.role,
      position: data.position,
      rank: data.rank,
      email: data.email,
      status: "Working",
      capacityHoursPerWeek: 40,
    })) as any;

    await Team.findByIdAndUpdate(data.teamId, {
      $push: { members: user._id },
    } as any);

    invalidateEntity(CACHE_TAGS.team(data.teamId));
    revalidatePath("/teams");
    return { id: user._id.toString(), name: user.name };
  });
}
