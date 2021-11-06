import dotenv from "dotenv";
import parse from "parse-link-header";
import fetch from "node-fetch";

dotenv.config();

const headers = {
  Authorization: `token ${process.env.GITHUB_API_TOKEN}`,
  "User-Agent": "Maksim Ivanov",
};
const user = "satansdeer";

async function getRepos(user) {
  let allRepos = [];
  let page = 1;
  let lastPage = 2;
  while (page <= lastPage) {
    const { repos, link } = await fetch(
      `https://api.github.com/users/${user}/repos?per_page=100&page=${page}`,
      {
        headers,
      }
    ).then((res) => {
      const link = parse(res.headers.get("link"));
      return { repos: res.json(), link };
    });
    allRepos = allRepos.concat(await repos);
		if(link && link.last && link.last.page) {
  	  lastPage = Number(link.last.page);
		}
    page++;
  }
  return allRepos;
}

async function mergePRs() {
  try {
    let allPrs = [];
    console.log("Getting repositories information...");
    const repos = await getRepos(user);
		// console.log(JSON.stringify(repos.map(repo => repo.name),null, 2));
    console.log(`Fetching PRs for ${repos.length} repositories...`);
    for (let repo of repos) {
      if (repo.owner.login === user) {
        try {
          const prs = await fetch(
            `https://api.github.com/repos/${user}/${repo.name}/pulls`,
            {
              headers,
            }
          ).then((res) => res.json());
          allPrs = allPrs.concat(await prs);
        } catch (e) {
          console.log(e);
        }
      }
    }
    console.log(`Found ${allPrs.length} Pull Requests`);
    for (let pr of allPrs) {
      console.log("===");
      console.log("Title", pr.title);
      console.log("URL", pr.url);
			console.log(pr.user.login)
      if (["dependabot[bot]", "snyk-bot"].includes(pr.user.login)) {
        console.log(`Merging ${pr.title}`);
        const result = await fetch(pr.url + "/merge", {
          method: "PUT",
          headers,
        }).then((res) => res.json());
        console.log(result.message);
      }
    }
  } catch (err) {
    console.log(err);
  }
}

mergePRs();
