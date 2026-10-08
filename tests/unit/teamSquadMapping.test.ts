import { describe, it, expect } from "vitest";
import {
  teamSquadMapping,
  TEAM_TYPE_DESCRIPTIONS,
  SQUAD_SHORT_CODES,
  getSquadPrefix,
  formatSquadLabel,
} from "@/app/teams/EstablishTeamForm";

describe("Operational Team & Squad Type Mapping and Prefix Generator", () => {
  it("should define all 13 corporate disciplines in teamSquadMapping", () => {
    const expectedDisciplines = [
      "dev",
      "prod",
      "qa",
      "ops",
      "sec",
      "data",
      "it",
      "biz",
      "hr",
      "mktg",
      "sales",
      "cust",
      "randd",
    ];

    expect(Object.keys(teamSquadMapping)).toEqual(expectedDisciplines);

    expectedDisciplines.forEach((key) => {
      expect(Array.isArray(teamSquadMapping[key])).toBe(true);
      expect(teamSquadMapping[key].length).toBeGreaterThan(0);
      expect(TEAM_TYPE_DESCRIPTIONS[key]).toBeDefined();
    });
  });

  it("should match user specification for dev squads and generate dev_front_{name} prefix", () => {
    expect(teamSquadMapping["dev"]).toEqual([
      "frontend",
      "backend",
      "fullstack",
      "mobile_ios",
      "mobile_android",
      "embedded_iot",
      "game_dev",
      "api_platform",
    ]);

    // Primary test case from user prompt:
    // when selected team type dev and squad type frontend then the prename added as dev_front_{name typed anything}
    const prefix = getSquadPrefix("dev", "frontend");
    expect(prefix).toBe("dev_front_");

    const customName = "checkout_flow";
    const fullTeamName = `${prefix}${customName}`;
    expect(fullTeamName).toBe("dev_front_checkout_flow");
  });

  it("should generate proper prefixes across all disciplines", () => {
    // dev backend -> dev_back_
    expect(getSquadPrefix("dev", "backend")).toBe("dev_back_");
    // prod uiux_design -> prod_uiux_
    expect(getSquadPrefix("prod", "uiux_design")).toBe("prod_uiux_");
    // qa test_automation -> qa_auto_
    expect(getSquadPrefix("qa", "test_automation")).toBe("qa_auto_");
    // ops devops -> ops_devops_
    expect(getSquadPrefix("ops", "devops")).toBe("ops_devops_");
    // ops sre_reliability -> ops_sre_
    expect(getSquadPrefix("ops", "sre_reliability")).toBe("ops_sre_");
    // sec secops -> sec_secops_
    expect(getSquadPrefix("sec", "secops")).toBe("sec_secops_");
    // data machine_learning -> data_ml_
    expect(getSquadPrefix("data", "machine_learning")).toBe("data_ml_");
    // it helpdesk_support -> it_helpdesk_
    expect(getSquadPrefix("it", "helpdesk_support")).toBe("it_helpdesk_");
    // biz corporate_strategy -> biz_strategy_
    expect(getSquadPrefix("biz", "corporate_strategy")).toBe("biz_strategy_");
    // hr talent_acquisition -> hr_ta_
    expect(getSquadPrefix("hr", "talent_acquisition")).toBe("hr_ta_");
    // mktg performance_marketing -> mktg_perf_
    expect(getSquadPrefix("mktg", "performance_marketing")).toBe("mktg_perf_");
    // sales lead_generation_sdr -> sales_sdr_
    expect(getSquadPrefix("sales", "lead_generation_sdr")).toBe("sales_sdr_");
    // cust customer_success -> cust_cs_
    expect(getSquadPrefix("cust", "customer_success")).toBe("cust_cs_");
    // randd innovation_lab -> randd_innov_
    expect(getSquadPrefix("randd", "innovation_lab")).toBe("randd_innov_");
  });

  it("should fallback gracefully if an unknown squad type is passed", () => {
    expect(getSquadPrefix("dev", "custom_experimental")).toBe("dev_custom_experimental_");
  });

  it("should format squad labels properly for human-readable display", () => {
    expect(formatSquadLabel("frontend")).toBe("Frontend");
    expect(formatSquadLabel("uiux_design")).toBe("Uiux Design");
    expect(formatSquadLabel("cloud_architecture")).toBe("Cloud Architecture");
  });
});
