CXX      ?= g++
CXXFLAGS ?= -std=c++11 -O2 -Wall -Wextra
BIN      := bin

PROGRAMS := trie skill_hashmap connection_bfs job_ranking

.PHONY: all test clean
all: $(addprefix $(BIN)/,$(PROGRAMS))

$(BIN):
	mkdir -p $(BIN)

$(BIN)/trie: search/trie.cpp | $(BIN)
	$(CXX) $(CXXFLAGS) -o $@ $<
$(BIN)/skill_hashmap: search/skill_hashmap.cpp | $(BIN)
	$(CXX) $(CXXFLAGS) -o $@ $<
$(BIN)/connection_bfs: graph/connection_bfs.cpp | $(BIN)
	$(CXX) $(CXXFLAGS) -o $@ $<
$(BIN)/job_ranking: ranking/job_ranking.cpp | $(BIN)
	$(CXX) $(CXXFLAGS) -o $@ $<

test: all
	@for p in $(PROGRAMS); do ./$(BIN)/$$p < /dev/null || exit 1; done

clean:
	rm -rf $(BIN)
