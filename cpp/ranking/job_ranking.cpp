// Job / opportunity ranking with a max-heap priority queue.
// JS counterpart used by the API: backend/dsa/jobRanking.js + PriorityQueue.js
//
// Build:  g++ -std=c++11 -O2 -o ../bin/job_ranking job_ranking.cpp
// Run:    ../bin/job_ranking
#include <algorithm>
#include <cassert>
#include <cctype>
#include <iostream>
#include <queue>
#include <set>
#include <string>
#include <vector>

struct Job {
    std::string title;
    std::vector<std::string> requiredSkills;
    double ageDays;       // days since posting
    double daysToDeadline;  // < 0 means no deadline
    bool referralAvailable;
};

struct Ranked {
    double score;
    const Job* job;
    // std::priority_queue is a max-heap on operator<, so higher score pops first.
    bool operator<(const Ranked& other) const { return score < other.score; }
};

static std::string lower(const std::string& s) {
    std::string o;
    for (size_t i = 0; i < s.size(); ++i) o += static_cast<char>(std::tolower(static_cast<unsigned char>(s[i])));
    return o;
}

// Same formula as the JS implementation.
double scoreJob(const Job& job, const std::set<std::string>& studentSkills) {
    int matched = 0;
    for (size_t i = 0; i < job.requiredSkills.size(); ++i)
        if (studentSkills.count(lower(job.requiredSkills[i]))) ++matched;

    double score = matched * 10.0;
    if (!job.requiredSkills.empty()) score += (static_cast<double>(matched) / job.requiredSkills.size()) * 10.0;
    if (job.referralAvailable) score += 3.0;
    score += std::max(0.0, 10.0 - job.ageDays / 3.0);
    if (job.daysToDeadline >= 0 && job.daysToDeadline <= 7) score += 4.0 - job.daysToDeadline / 2.0;
    return score;
}

std::vector<Ranked> rankJobs(const std::vector<Job>& jobs, const std::set<std::string>& skills) {
    std::priority_queue<Ranked> pq;
    for (size_t i = 0; i < jobs.size(); ++i) {
        Ranked r;
        r.score = scoreJob(jobs[i], skills);
        r.job = &jobs[i];
        pq.push(r);  // O(log n)
    }
    std::vector<Ranked> ordered;
    while (!pq.empty()) { ordered.push_back(pq.top()); pq.pop(); }
    return ordered;
}

static Job makeJob(const std::string& title, const char* skills[], size_t n, double age, double deadline, bool referral) {
    Job j;
    j.title = title;
    for (size_t i = 0; i < n; ++i) j.requiredSkills.push_back(skills[i]);
    j.ageDays = age;
    j.daysToDeadline = deadline;
    j.referralAvailable = referral;
    return j;
}

int main() {
    const char* web[] = {"React", "Node.js", "MongoDB"};
    const char* ml[] = {"Python", "Machine Learning"};
    const char* embedded[] = {"C", "RTOS"};

    std::vector<Job> jobs;
    jobs.push_back(makeJob("Full Stack Developer", web, 3, 2, 5, true));
    jobs.push_back(makeJob("Data Science Intern", ml, 2, 1, -1, false));
    jobs.push_back(makeJob("Embedded Firmware Intern", embedded, 2, 10, 20, true));

    std::set<std::string> student;
    student.insert("react");
    student.insert("node.js");
    student.insert("mongodb");

    std::vector<Ranked> out = rankJobs(jobs, student);
    assert(out.front().job->title == "Full Stack Developer");
    for (size_t i = 1; i < out.size(); ++i) assert(out[i - 1].score >= out[i].score);

    std::cout << "Ranking for a React/Node/MongoDB student:\n";
    for (size_t i = 0; i < out.size(); ++i) std::cout << "  " << (i + 1) << ". " << out[i].job->title << "  (score " << out[i].score << ")\n";
    std::cout << "Job ranking self-test passed.\n";
    return 0;
}
