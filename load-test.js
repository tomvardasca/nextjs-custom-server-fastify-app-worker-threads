import http from "k6/http";

export const options = {
  thresholds: {
    "http_req_duration{scenario:worker}": ["p(95)<250", "p(99)<350"],
    "http_req_duration{scenario:single}": ["p(95)<250", "p(99)<350"],
    "http_reqs{scenario:worker}": ["count>10"],
    "http_reqs{scenario:single}": ["count>10"],
    "data_received{scenario:worker}": ["count<50"],
    "data_received{scenario:single}": ["count<50"],
  },
  scenarios: {
    worker: {
      executor: "constant-vus",
      vus: 75,
      duration: "15s",
      exec: "worker",
    },
    single: {
      executor: "constant-vus",
      vus: 75,
      duration: "15s",
      startTime: "25s",
      exec: "single",
    },
  },
};

export function worker() {
  http.get("http://localhost:3000/aw", {
    tags: { my_custom_tag: "worker" },
  });
}

export function single() {
  http.get("http://localhost:3000/as", {
    tags: { my_custom_tag: "single" },
  });
}
