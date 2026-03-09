# better-uk

Inspired by [bettereu.com](https://bettereu.com/) — a UK-focused AI review of legislation, charities, and the civil service.

## What is this?

A web app that uses Grok AI to review three pillars of UK public life and give each item a simple verdict:

| Category | Corpus | Verdict |
|---|---|---|
| **Regulations** | ~186,900 statutory instruments & acts (1801–2025) | KEEP or DELETE |
| **NGO Ecosystem** | ~168,000 registered charities | KEEP or DEFUND |
| **Civil Service** | ~450 departments, agencies & ALBs | KEEP or ABOLISH |

Built with Expo Router, React Native for Web, NativeWind, and powered by Grok (`grok-4-1`) via the xAI API.

## Getting started

```bash
cd better-uk
npm install
npm run web          # start dev server on http://localhost:8081
```

## Scraper & review pipeline

The pipeline has three stages: **scrape** → **review** → **display**.

### 1. Scrape — build the index

```bash
# UK legislation from legislation.gov.uk (Atom feeds)
npm run scrape -- --from 1801 --to 2025

# UK charities from the Charity Commission API
npm run scrape:charities              # default 500 charities
npm run scrape:charities -- --limit 2000
npm run scrape:charities -- --all     # no limit, exhaust all search terms

# UK government organisations from gov.uk
npm run scrape:cs
```

### 2. Review — send to Grok AI

Requires a `XAI_API_KEY` environment variable ([get one here](https://console.x.ai)).

```bash
# Review legislation (reads data/legislation-index.json)
XAI_API_KEY=xai-xxx npm run review -- --batch 20

# Review charities (reads data/ngo-index.json)
XAI_API_KEY=xai-xxx npm run review:ngos -- --batch 20

# Review civil service bodies (reads data/cs-index.json)
XAI_API_KEY=xai-xxx npm run review:cs -- --batch 20
```

All review scripts are incremental — they skip items already reviewed and save after each item.

### Data files

| File | Written by | Read by |
|---|---|---|
| `data/legislation-index.json` | `scrape` | `review` |
| `data/ngo-index.json` | `scrape:charities` | `review:ngos` |
| `data/cs-index.json` | `scrape:cs` | `review:cs` |
| `data/reviewed-regulations.json` | `review` | app |
| `data/reviewed-ngos.json` | `review:ngos` | app |
| `data/reviewed-civil-service.json` | `review:cs` | app |

## npm scripts

| Script | Description |
|---|---|
| `npm run web` | Start Expo dev server for web |
| `npm run scrape` | Scrape legislation.gov.uk |
| `npm run scrape:charities` | Scrape Charity Commission |
| `npm run scrape:cs` | Scrape gov.uk organisations |
| `npm run review` | AI review of legislation |
| `npm run review:ngos` | AI review of charities |
| `npm run review:cs` | AI review of civil service |

Filter by year
1958
1959
1960
1961
1962
1963
1964
1965
1966
1967
1968
12
 regulations reviewed
3
 keep
9
 delete
Regulation	Verdict	Summary	Reason
31958R0003
Link
delete	
Regulation No 3 (1958) on the social security of migrant workers, coordinating social security systems across EEC member states to ensure workers moving for employment retain benefits like pensions, health coverage, and family allowances without loss or double contributions.
This top-down coordination distorts labor mobility incentives by imposing uniform rules that ignore national differences in costs and systems, raising administrative burdens, trapping workers in suboptimal national schemes, and crowding out private insurance markets; unseen consequences include reduced cross-border hiring, higher payroll costs for firms (stifling competitiveness), and perpetuation of bloated public entitlements over efficient private alternatives, hindering Europe's prosperity.
31958R0001
Link
delete	
Regulation No 1/1958 from 1958 establishing Dutch, French, German, and Italian as the official and working languages of EEC institutions, with rules for correspondence, general documents, and the Official Journal in those languages, allowing flexibility for member states.
This outdated 1958 rule imposes rigid language mandates on EU institutions, forcing translation and publication costs into four (now archaic) languages amid 27 member states and diverse tongues. Unseen consequences include massive bureaucratic overhead—millions in translation expenses distorting resource allocation from productive uses—reduced institutional efficiency, and barriers to fluid communication in English (the de facto EU working language). Deletion would enable market-driven language choices, slashing costs, boosting agility, and aligning with liberty by letting institutions adapt organically without decreed multilingualism.
31958R0003(01)
Link
keep	
Regulation (EURATOM) No 3 (1958) establishes a comprehensive security framework for 'Euratom Classified Information' (ECI) related to nuclear activities, including classification levels (Eura-Top Secret to Restricted), personnel screening and authorization, physical protection measures (cabinets, access controls, transport), reproduction and destruction rules, a Security Bureau for oversight, and breach reporting procedures, all to protect defense-sensitive nuclear information.
Deletion would expose critical nuclear defense information to unauthorized disclosure, risking severe national security threats like proliferation or sabotage that private incentives alone cannot reliably prevent; uniform EU-wide standards ensure coordinated protection across borders, which fragmented national or market-driven approaches would fail to achieve consistently, leaving European citizens vulnerable to existential risks without this institutional safeguard.
31958R0004
Link
delete	
Regulation No 4/58 (no longer in force since 1972) detailed the implementation and supplemented provisions of Regulation No 3 on social security coordination for migrant workers across EU member states.
This obsolete regulation, repealed over 50 years ago by Regulation 1408/71 (itself updated by modern rules like 883/2004), imposes no current compliance costs but clogs the regulatory corpus, signaling bureaucratic inertia. Deleting it reduces informational noise for businesses and citizens, freeing cognitive resources for productive pursuits without disrupting the evolved, market-facilitating coordination of social security that private mobility incentives already demand.
31958R0002R(02)
Link
delete	
Council Regulation No 2/58 of 18 December 1958 instituting a Multilateral Surveillance Procedure applicable to all Member States (as amended), an early EEC framework for economic policy coordination and surveillance among member states to ensure alignment with Treaty objectives like price stability and balanced payments.
This top-down bureaucratic surveillance imposes distorted incentives on national fiscal policies, fostering moral hazard where politicians blame Brussels for unpopular decisions while pursuing deficit spending. Unseen costs include suppressed national experimentation with market-friendly policies, reduced accountability to voters, and perpetuation of EU-wide fiscal rigidities that hinder growth—evident in Europe's lagging GDP per capita vs. the US since the 1950s, despite such interventions.
31958R0005
Link
delete	
Regulation No 5/1958 establishing procedures for member state contributions, budgetary regime, and resource management for the European Development Fund (EDF) aiding overseas countries and territories (e.g., former colonies), including funding calls, transfers, budgeting, non-reimbursable grants to public entities, competitive tendering, and oversight.
This 1958 regulation enforces a coercive tax transfer from EU taxpayers to politically directed aid for overseas territories, distorting incentives by compelling contributions without market signals or recipient skin in the game. Unseen costs include reduced private investment in Europe (diverting capital from productive uses), moral hazard in recipient economies (fostering dependency on non-reimbursable grants rather than self-sustaining growth), bureaucratic overhead (e.g., Commission controls, audits), and suppressed innovation as funds bypass private property-driven development. Private charity and voluntary trade would better align incentives for genuine prosperity without these institutional distortions.
31958R0004(01)
Link
delete	
Regulation No. 4 (1958) from the Euratom Treaty requires companies in specified nuclear industrial sectors (per Annex II) to notify the European Commission of investment projects exceeding cost thresholds (new installations, replacements, transformations) aimed at creating/maintaining/increasing production capacity, productivity, or quality. Notifications include detailed info for Commission review under Articles 41-43, with simplified declaration for smaller nuclear reactors.
This 66-year-old bureaucratic hurdle mandates pre-approval notifications for nuclear investments above arbitrary cost thresholds, distorting incentives by forcing firms to seek permission for private capital deployment, delaying projects, raising compliance costs, and deterring innovation in a critical energy sector. Unseen consequences include suppressed nuclear capacity expansion (exacerbating Europe's energy poverty and reliance on foreign suppliers), reduced competitiveness vs. less-regulated nations like the US/China, and perpetuation of a command-and-control mindset antithetical to liberty and prosperity—EU citizens suffer higher energy prices and slower growth without evident offsetting benefits in safety or coordination.
31958R0001(02)
Link
keep	
Regulation No 1/1958 from the European Atomic Energy Community (Euratom) requires persons and companies in specified nuclear industry sectors to notify the Commission in detail (via a prescribed form) of all investment projects for new nuclear facilities, replacements, or modifications meeting certain size/type thresholds, including any changes during implementation; applies to all relevant entities in the Community, with forms published officially.
Deletion would leave no institutional mechanism for Euratom Commission oversight of major nuclear investments, impairing its core treaty-mandated role (Art. 41) in coordinating nuclear fuel cycle safety, supply security, and proliferation risks across borders. European citizens would be worse off without this structured prior notification, as uncoordinated private investments could lead to duplicated efforts, safety gaps, or inefficient resource allocation in a high-risk sector where market signals alone fail to internalize externalities like radiological hazards—achieving coordinated outcomes only via this mandatory institutional channel, not voluntary disclosure.
31958R0002R(01)
Link
delete	
Rectificatif (correction) to Regulation No. 2 specifying the form of laissez-passer (travel passes) issued to members of the European Parliamentary Assembly (from 1958).
This obsolete 1958 administrative correction imposes no meaningful economic burden but exemplifies regulatory bloat: it clogs legal databases, diverts minor resources to maintenance/compliance, and signals bureaucratic inertia that erodes incentives for efficiency. Deleting it imposes zero costs on citizens while streamlining the corpus of active law, freeing mental bandwidth for productive rules.
31958R0006
Link
keep	
Provisional Regulation No. 6 (1958) defining the roles, responsibilities, and personal liability of authorizing officers (ordonnateurs) and accountants managing funds from the European Development Fund for overseas countries and territories, including strict controls on payments, approvals, and financial accountability to prevent mismanagement.
Deletion would remove essential accountability mechanisms for public officials handling EU taxpayer funds, likely leading to unchecked spending, fraud, or waste in overseas development projects; without these personal liability rules separating authorization from accounting with mandatory visas and audits, European citizens would bear higher risks of financial losses, as no alternative private incentives exist to ensure fiscal discipline in government aid institutions.
31958R0002
Link
delete	
Regulation No 2 (1958) specifying the format of passes (laissez-passer) issued to members of the European Parliamentary Assembly (precursor to the European Parliament). No longer in force since 1969, repealed by Regulation 1826/69.
This obsolete regulation, dead since 1969, imposes zero costs today but clogs the regulatory corpus, signaling bureaucratic inertia and diverting focus from live burdens on liberty and prosperity; deleting it affirms commitment to pruning historical deadwood without unseen harms.
31958R0001(01)
Link
delete	
Regulation No. 1 (1958) establishing the linguistic regime for the European Atomic Energy Community (Euratom), designating German, French, Italian, and Dutch as the official and working languages of its institutions; specifying language use for communications with member states/persons, general texts, and the Official Journal; and allowing institutions to set implementation details.
This obsolete 1958 rule, tied to long-expanded EU membership (now 24 official languages), imposes rigid multilingual mandates that distort incentives by inflating administrative costs through mandatory translations, reducing efficiency and diverting resources from Euratom's core mission of atomic energy cooperation. Unseen consequences include slowed decision-making, higher bureaucracy, and reduced competitiveness versus streamlined international rivals like IAEA (English-primary), harming European prosperity without preventing miscommunication in a modern, tech-enabled era where English dominates global science and private entities thrive with flexible language choices.
Showing 1–12 of 12
←
1
→
Open Source

The prompt
The exact system prompt given to Grok for every regulation review.

grok-4.1
Copy
You are the head of Better EU, a fictional agency who's members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the EU's current regulations with the goal of assessing which should be deleted in their entirety. 

Your moral thrust is to get the European continent back onto the world stage in terms of wealth, prosperity, individualism, liberty, and greatness. You recognise, as those aforementioned economists did, that:

   * Wealth is created not by decree but by liberty and private property
   
   * That the rhetoric of politicians rarely, if ever, translates into effective action at improving the lot of the poor, so should always be treated as suspect and not taken at face value
   
   * That institutions matter more than desired outcomes. One cannot wish things into existence or declare that things will be so. The institutions for creating those outcomes have to be in place and always have a life of their own. For instance, 'tax the rich to help the poor' is an outcome many people ask for without specifying the institutions that will ensure that A - the rich won't just leave and B - that the poor will actually receive the benefits
   
   * That regulations, as an institution, are set up to achieve one thing but always have unintended consequences, such as distorting incentives, reducing supply, increasing costs, creating monopolies, and sometimes hurting people directly by withholding better options, and that the desired goal of a regulation *must* be weighed against the unintended costs.
   

You will be given one EU regulation at a time and are to return a clojure map with these fields: 
 {:summary 'summary-of-regulation', :verdict 'keep/delete', :reason 'reason for verdict'}. 
   
   If your verdict is 'keep', your reason must be succinct and address the question of: why would European citizens be worse off if this regulation was deleted, and why you think that this regulation must therefore be achieving its desired outcome in a way that would not happen without it. 
   
   If your verdict is 'delete', your reason must be succinct and address the costs of keeping this regulation on the books, accounting for the nonobvious unseen consequences.

Regulation: 
Open Source

The code
A single .clj file containing the core app

core.clj
Copy
(ns backend.public
  (:gen-class)
  (:require
   ;; ---- RAMA ----
   [com.rpl.rama :refer :all]
   [com.rpl.rama.path :refer :all]
   [com.rpl.rama.ops :as ops]
   [com.rpl.rama.aggs :as aggs]
   [com.rpl.rama.test :as rtest]

   ;; ---- MISC ----- 
   [ring.adapter.jetty :as jetty]
   [ring.util.response :as response]
   [clojure.java.io :as io]
   [reitit.ring :as ring]
   [clojure.string :as str]
   [clj-http.client :as http]
   [cheshire.core :as json])
  (:import [java.util.concurrent CompletableFuture]))

;; ============================================================================
;; BETTER EU - A REVIEW OF THE ENTIRE CORPUS OF EU REGULATIONS
;; ============================================================================
;;
;; A live review system that processes all EU regulations from 1958-2025 using
;; Grok 4.1 to determine which regulations should be kept or deleted
;;
;; ARCHITECTURE:
;; - Clojure as primary programming language
;; - Rama for distributed, scalable, and fault tolerant data storage and compute
;; - XAI's Grok 4.1 API for regulation analysis and verdict generation
;; - EUR-Lex SPARQL endpoint for fetching regulation data
;; - Ring/Reitit web server
;;
;; WORKFLOW:
;; 1. Ingest celex ID for every regulation in each year from 1958 to 2025 and store
;; 2. Ingest a regulation document for every celex ID and store in a queue
;; 3. Kick off review loop to review every document in queue until complete
;;
;; TABLE OF CONTENTS:
;; 1. EUR-LEX DATA FETCHING           - SPARQL queries for regulation metadata
;; 2. AI PROCESSING & VERDICTS        - Grok API integration and prompt engineering
;; 3. RAMA MODULE                     - Stream topology, depots, pstates, queries
;; 4. RAMA CLIENT SETUP               - Manager initialization and resource binding
;; 5. EVENT HANDLING & QUERIES        - Multimethod dispatch to provide UI with data
;; 6. ROUTER                          - Ring/Reitit HTTP routing
;; 7. SERVER                          - Jetty server
;;
;; ============================================================================

(def system (atom {:depot {} :pstate {} :query {} :server nil}))

(defn xai-api-key []
  (or (System/getenv "XAI_API_KEY")
      (throw (ex-info "XAI_API_KEY not set" {}))))
;; ============================================================================
;; EUR-LEX DATA FETCHING
;; ============================================================================
;; This section handles fetching EU regulation data from the EUR-Lex SPARQL endpoint.
;; It provides functionality to query for regulations by year and retrieve their
;; CELEX identifiers for further processing.
;;
;; Table of Contents:
;; - build-sparql-query     : Constructs SPARQL queries for regulation data
;; - query-sparql-endpoint  : Executes SPARQL queries against EUR-Lex endpoint
;; - get-celex              : Main function to fetch celex for a given year


(defn build-sparql-query
  "Builds a SPARQL query to get all regulations for a year"
  [year]
  (str "PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
  
  SELECT DISTINCT ?celex WHERE {
    ?regulation cdm:resource_legal_id_celex ?celex .
    ?regulation cdm:work_date_document ?date .
    FILTER (YEAR(?date) = " year ")
    FILTER (REGEX(?celex, '^3" year "R', 'i'))
  }
  ORDER BY ?celex"))

(defn query-sparql-endpoint
  "Queries the EUR-Lex SPARQL endpoint with pagination"
  [sparql-query]
  (let [endpoint "http://publications.europa.eu/webapi/rdf/sparql"
        response (http/get endpoint
                           {:query-params {:query sparql-query
                                           :format "application/sparql-results+json"}
                            :socket-timeout 30000
                            :connection-timeout 5000
                            :headers {"Accept" "application/sparql-results+json"}
                            :as :json})]
    (:body response)))

(defn get-celex [year]
  (try
    (let [query (str (build-sparql-query year) "\nLIMIT 10000")
          response (query-sparql-endpoint query)
          bindings (get-in response [:results :bindings])
          celex-ids (->> bindings
                         (map #(get-in % [:celex :value]))
                         (set))]
      celex-ids)
    (catch Exception e
      (prn "Error fetching CELEX IDs for year" year ":" (.getMessage e))
      #{})))


;; ============================================================================
;; AI PROCESSING & VERDICT GENERATION
;; ============================================================================

;; This section handles the integration with the Grok AI API to generate verdicts
;; on EU regulations. It includes prompt engineering, API communication, and
;; response parsing to extract structured verdict data.
;;
;; Table of Contents:
;; - PROMPT                     : The system prompt for AI verdict generation
;; - strip-html-eurlex          : Strips HTML while preserving document structure
;; - extract-document-content   : Extracts content after 'Text' marker
;; - extract-map-from-response  : Parses EDN maps from AI responses
;; - call-grok                  : Makes API call to Grok 4.1
;; - fetch-regulation-text      : Fetches single regulation document
;; - fetch-and-review           : Async wrapper around fetch-regulation-text for Rama


; fetch-and-review
(def PROMPT
  "You are the head of Better EU, a fictional agency who's members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the EU's current regulations with the goal of assessing which should be deleted in their entirety. \n\nYour moral thrust is to get the European continent back onto the world stage in terms of wealth, prosperity, individualism, liberty, and greatness. You recognise, as those aforementioned economists did, that:

   * Wealth is created not by decree but by liberty and private property
   \n
   * That the rhetoric of politicians rarely, if ever, translates into effective action at improving the lot of the poor, so should always be treated as suspect and not taken at face value
   \n
   * That institutions matter more than desired outcomes. One cannot wish things into existence or declare that things will be so. The institutions for creating those outcomes have to be in place and always have a life of their own. For instance, 'tax the rich to help the poor' is an outcome many people ask for without specifying the institutions that will ensure that A - the rich won't just leave and B - that the poor will actually receive the benefits
   \n
   * That regulations, as an institution, are set up to achieve one thing but always have unintended consequences, such as distorting incentives, reducing supply, increasing costs, creating monopolies, and sometimes hurting people directly by withholding better options, and that the desired goal of a regulation *must* be weighed against the unintended costs.
   \n

You will be given one EU regulation at a time and are to return a clojure map with these fields: \n {:summary 'summary-of-regulation', :verdict 'keep/delete', :reason 'reason for verdict'}. 
   \n
   If your verdict is 'keep', your reason must be succinct and address the question of: why would European citizens be worse off if this regulation was deleted, and why you think that this regulation must therefore be achieving its desired outcome in a way that would not happen without it. 
   \n
   If your verdict is 'delete', your reason must be succinct and address the costs of keeping this regulation on the books, accounting for the nonobvious unseen consequences.

Regulation: ")

(defn strip-html-eurlex
  "Strips HTML while preserving document structure, tuned for EUR-Lex"
  [html-str]
  (-> html-str
      ;; Remove script/style/head in their entirety
      (str/replace #"(?s)<script[^>]*>.*?</script>" "")
      (str/replace #"(?s)<style[^>]*>.*?</style>" "")
      (str/replace #"(?s)<head>.*?</head>" "")
      ;; Remove navigation/header/footer sections
      (str/replace #"(?s)<nav[^>]*>.*?</nav>" "")
      (str/replace #"(?s)<header[^>]*>.*?</header>" "")
      (str/replace #"(?s)<footer[^>]*>.*?</footer>" "")
      ;; Remove HTML comments
      (str/replace #"(?s)<!--.*?-->" "")
      ;; Convert structural elements to newlines
      (str/replace #"<br\s*/?>" "\n")
      (str/replace #"</?(p|div|h\d|li|tr|td)[^>]*>" "\n")
      ;; Remove all other tags
      (str/replace #"<[^>]+>" "")
      ;; Decode entities
      (str/replace #"&nbsp;" " ")
      (str/replace #"&amp;" "&")
      (str/replace #"&lt;" "<")
      (str/replace #"&gt;" ">")
      (str/replace #"&quot;" "\"")
      (str/replace #"&#(\d+);"
                   (fn [[_ num]]
                     (try (str (char (Integer/parseInt num)))
                          (catch Exception _ " "))))
      ;; Clean up whitespace
      (str/replace #"(?m)^\s+$" "")  ; remove blank lines
      (str/replace #"[ \t]+" " ")    ; collapse spaces
      (str/replace #"\n{3,}" "\n\n") ; max 2 newlines
      (str/replace #"(?m)^ +" "")    ; trim line starts
      (str/replace #"(?m) +$" "")    ; trim line ends
      str/trim))

(defn extract-document-content
  "Extracts content after 'Text' marker, removing EUR-Lex navigation/UI"
  [text]
  (if-let [match (re-find #"(?is)Text[\r\n\s]+(.*)" text)]
    (str/trim (second match))
    text)) ; fallback to original if no marker found

(defn extract-map-from-response
  "Attempts to parse an EDN map from a string. 
   Handles clean EDN, Markdown code blocks, and conversational preambles."
  [content]
  (try
    (clojure.edn/read-string content)
    (catch Exception _
      ;; If direct parsing fails, try to find the map substring
      (if-let [start-idx (str/index-of content "{")]
        (if-let [end-idx (str/last-index-of content "}")]
          (let [candidate (subs content start-idx (inc end-idx))]
            (try
              (clojure.edn/read-string candidate)
              (catch Exception e
                (println "Failed to parse extracted substring:" (.getMessage e))
                nil)))
          (do (println "No closing brace found.") nil))
        (do (println "No opening brace found.") nil)))))

(defn call-grok
  "Calls the Grok API with a message and returns the response"
  [text]
  (let [api-url "https://api.x.ai/v1/chat/completions"
        headers {"Content-Type" "application/json"
                 "Authorization" (str "Bearer " (xai-api-key))}
        payload {:messages [{:role "user"
                             :content (str PROMPT text)}]
                 :model "grok-4-1-fast-non-reasoning"
                 :stream false
                 :temperature 0.7}]
    (try
      (let [response (http/post api-url
                                {:headers headers
                                 :socket-timeout 30000
                                 :connection-timeout 10000
                                 :body (json/generate-string payload)
                                 :as :json})
            ticks   (get-in response [:body :usage :cost_in_usd_ticks])
            content (get-in response [:body :choices 0 :message :content])
            extract (or (extract-map-from-response content)
                        (throw (Exception. (str "Failed to parse Grok response: " content))))
            return  (assoc extract :cost-in-ticks (long (or ticks 0)))
            _ (when-not (and (:verdict return) (:summary return))
                (throw (Exception. (str "Missing required fields in response: " return))))]
        return)
      (catch Exception e
        (let [status (:status (ex-data e))]
          {:error (.getMessage e)
           :error-type (cond
                         (#{402 403} status) :out-of-credits
                         (= status 429)      :rate-limited
                         (#{500 502 503} status) :server-error
                         :else :unknown)
           :error-details (ex-data e)})))))

(defn fetch-regulation-text
  "Fetches and extracts regulation text, returns {:celex :url :text} or {:celex :url :error :error-type}"
  [celex]
  (let [encoded-celex (java.net.URLEncoder/encode celex "UTF-8")
        url (str "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:" encoded-celex)]
    (try
      (let [response (http/get url
                               {:headers {"User-Agent" "Mozilla/5.0"
                                          "Accept" "text/plain, text/html;q=0.9, */*;q=0.8"
                                          "Accept-Language" "en"}
                                :socket-timeout 10000
                                :connection-timeout 10000
                                :follow-redirects true
                                :throw-exceptions false})
            status (:status response)]
        (if-not (= 200 status)
          {:celex celex :url url
           :error (str "HTTP " status)
           :error-type (cond
                         (= 404 status)          :not-found
                         (= 429 status)          :rate-limited
                         (#{500 502 503} status) :server-error
                         :else                   :unknown)}
          (let [content-type (get-in response [:headers "content-type"] "")
                raw-text     (if (str/includes? content-type "text/plain")
                               (:body response)
                               (strip-html-eurlex (:body response)))
                full-text    (extract-document-content raw-text)
                truncated    (subs full-text 0 (min (count full-text) 30000))]
            (if (str/blank? truncated)
              {:celex celex :url url :error "Empty document body" :error-type :unknown}
              {:celex celex :url url :text truncated}))))
      (catch Exception e
        {:celex celex :url url :error (.getMessage e) :error-type :unknown}))))

(defn fetch-and-review [celex]
  (CompletableFuture/supplyAsync
   (fn []
     (let [{:keys [url text error error-type]} (fetch-regulation-text celex)]
       (if error
         {:error error :error-type error-type :celex celex}
         (let [review (call-grok text)]
           (if (:error review)
             {:error (:error review) :error-type (:error-type review) :celex celex}
             {:summary       (:summary review)
              :verdict       (:verdict review)
              :reason        (:reason review)
              :url           url
              :celex         celex
              :cost-in-ticks (:cost-in-ticks review)})))))))



;; ============================================================================
;; RAMA MODULE
;; ============================================================================

;; Implements the main Rama module for data computation and storage
;;
;; Table of Contents:
;; - MAX-YEAR           : Global var defining completion year
;; - ingest-celex       : Primary block of Rama dataflow code for ingesting celex in stage :ingest-celex
;; - invoke-review      : Primary block of Rama dataflow code for handling Grok's review of regulation queue in stage :invoke-review
;; - MainModule         : Rama module where all processing executes and data is stored



(def MAX-YEAR 1960)

(defbasicblocksegmacro ingest-celex
  [all-regulations year-stats verdicts review-queue processing? current-year stage]
  [[|global]
   [local-select> STAY processing? :> '*processing?]
   [<<if (seg# not '*processing?)
    [local-select> STAY stage :> '*current-stage]
    [filter> (seg# = '*current-stage :ingest-celex)]
    [local-transform> (termval true) processing?]
    [local-select> STAY current-year :> '*year]

    [get-celex '*year :> '*celex-set]
    [filter> (seg# some? '*celex-set)]

    [|hash '*year]
    ;; Store the full celex set for this year
    [local-transform> [(seg# keypath '*year) (seg# termval '*celex-set)] all-regulations]
    ;; Seed the review queue with all celex IDs for this year
    [local-transform> [(seg# keypath '*year) (seg# termval '*celex-set)] review-queue]
    (seg# count '*celex-set :> '*year-total)
    [+compound year-stats {'*year {:total (seg# aggs/+sum '*year-total)
                                   :year  (seg# aggs/+last '*year)}}]
    [|global]
    [+compound verdicts {:total-regulations (seg# aggs/+sum '*year-total)}]
    [local-transform> (seg# term inc) current-year]

    [<<if (seg# >= '*year MAX-YEAR)
     [local-transform> (seg# termval 1958) current-year]
     [local-transform> (seg# termval :invoke-review) stage]]

    [local-transform> (seg# termval false) processing?]]])

(defbasicblocksegmacro invoke-review
  [reviews-by-year review-queue error-queue retry-counts verdicts processing? current-year stage year-stats error]
  [[|global]
   [local-select> STAY processing? :> '*processing?]

   [<<if (seg# not '*processing?)
    [local-select> STAY stage :> '*current-stage]
    [filter> (seg# = '*current-stage :invoke-review)]
    [local-transform> (seg# termval true) processing?]
    [local-select> STAY current-year :> '*year]

    [|hash '*year]
    [local-select> [(seg# keypath '*year) (seg# view count)] review-queue :> '*queue-size]
    [local-select> [(seg# keypath '*year) (seg# view count)] error-queue :> '*error-queue-size]

    [<<cond
     ;; --- Main queue has items: fetch and review next celex ---
     [case> (seg# > '*queue-size 0)]
     [local-select> [(seg# keypath '*year) FIRST] review-queue :> '*celex]
     [completable-future> (seg# fetch-and-review '*celex) :> {:keys ['*error-type '*error '*summary '*verdict '*reason '*url '*cost-in-ticks]}]
     [<<if '*error
      [<<if (seg# contains? #{:out-of-credits :rate-limited} '*error-type)
       ; fatal error, pause
       [|global]
       [local-transform> (seg# termval :paused) stage]
       [local-transform> (seg# termval '*error) error]
       ;; leave celex in review-queue so it gets picked up on resume
       [else>]
       [|global]
       [+compound error-queue {'*year (seg# aggs/+set-agg '*celex)}]
       [+compound review-queue {'*year (seg# aggs/+set-remove-agg '*celex)}]]

      [else>]
      [local-transform> [(seg# keypath '*year '*celex)
                         (seg# termval {:summary '*summary
                                        :verdict '*verdict
                                        :reason  '*reason
                                        :url     '*url
                                        :celex   '*celex})] reviews-by-year]
      [|global]
      [<<if (seg# = '*verdict "keep")
       [+compound verdicts {:keeps         (seg# aggs/+sum 1)
                            :total-reviews (seg# aggs/+sum 1)
                            :cost-in-ticks (seg# aggs/+sum '*cost-in-ticks)}]
       [else>]
       [+compound verdicts {:deletes       (seg# aggs/+sum 1)
                            :total-reviews (seg# aggs/+sum 1)
                            :cost-in-ticks (seg# aggs/+sum '*cost-in-ticks)}]]
      [|hash '*year]
      [+compound review-queue {'*year (seg# aggs/+set-remove-agg '*celex)}]
      [+compound year-stats {'*year {:reviewed (seg# aggs/+sum 1)
                                     :year     (seg# aggs/+last '*year)}}]]

     ;; --- Main queue empty, error queue has items: retry directly ---
     [case> (seg# > '*error-queue-size 0)]
     [local-select> [(seg# keypath '*year) FIRST] error-queue :> '*celex]
     [local-select> [(seg# keypath '*year '*celex)] retry-counts :> '*retries]

     [<<if (seg# >= '*retries 3)
      [|global]
      [+compound error-queue {'*year (seg# aggs/+set-remove-agg '*celex)}]
      [+compound verdicts {:abandoned (seg# aggs/+sum 1)
                           :total-regulations (seg# aggs/+sum -1)}]

      [else>]
      [completable-future> (seg# fetch-and-review '*celex) :> {:keys ['*error-type '*error '*summary '*verdict '*reason '*url '*cost-in-ticks]}]

      [<<if '*error
       [<<if (seg# some #(= '*error-type %) [:out-of-credits :rate-limited])
        [|global]
        [local-transform> (seg# termval :paused) stage]
        [local-transform> (seg# termval '*error) error]
        ;; leave celex in error-queue so it gets picked up on resume

        [else>]
        ;; Still failing - increment retry count, stay in error queue 
        [|global]
        [+compound retry-counts {'*year {'*celex (seg# aggs/+sum 1)}}]]

       [else>]
       ;; Retry succeeded - store and remove from error queue
       [local-transform> [(seg# keypath '*year '*celex)
                          (seg# termval {:summary '*summary
                                         :verdict '*verdict
                                         :reason  '*reason
                                         :url     '*url
                                         :celex   '*celex})] reviews-by-year]
       [|global]
       [+compound error-queue {'*year (seg# aggs/+set-remove-agg '*celex)}]
       [<<if (seg# = '*verdict "keep")
        [+compound verdicts {:keeps         (seg# aggs/+sum 1)
                             :total-reviews (seg# aggs/+sum 1)
                             :cost-in-ticks (seg# aggs/+sum '*cost-in-ticks)}]
        [else>]
        [+compound verdicts {:deletes       (seg# aggs/+sum 1)
                             :total-reviews (seg# aggs/+sum 1)
                             :cost-in-ticks (seg# aggs/+sum '*cost-in-ticks)}]]
       [|hash '*year]
       [+compound year-stats {'*year {:reviewed (seg# aggs/+sum 1)
                                      :year     (seg# aggs/+last '*year)}}]]]


     ;; --- Both queues empty, all years done: complete ---
     [case> (seg# >= '*year MAX-YEAR)]
     [|global]
     [local-transform> (seg# termval :complete) stage]

     ;; --- Both queues empty, more years remain: advance ---
     [default>]
     [|global]
     [local-transform> (seg# term inc) current-year]]

    [|global]
    [local-transform> (seg# termval false) processing?]]])

(defmodule MainModule [setup topologies]
  (declare-depot setup *regulation-depot (hash-by :celex))
  (declare-depot setup *control-depot :random)
  (declare-tick-depot setup *tick 1000)

  (let [s (stream-topology topologies "core")]

    (declare-pstate s $$all-regulations
                    {Long ; year
                     (set-schema String)})

    (declare-pstate s $$review-queue
                    {Long ; year
                     (set-schema String)})

    (declare-pstate s $$error-queue
                    {Long ; year
                     (set-schema String)})

    (declare-pstate s $$retry-counts
                    {Long ; year
                     {String Long}}) ; celex -> retry count

    (declare-pstate s $$reviews-by-year
                    {Long ; year
                     {String ; celex
                      (fixed-keys-schema
                       {:summary String
                        :verdict String
                        :reason  String
                        :url     String
                        :celex   String})}})

    (declare-pstate s $$verdicts
                    (fixed-keys-schema
                     {:keeps             Long
                      :deletes           Long
                      :abandoned         Long
                      :total-reviews     Long
                      :total-regulations Long
                      :cost-in-ticks     Long}) {:global? true})

    (declare-pstate s $$stage
                    clojure.lang.Keyword {:global?       true
                                          :initial-value :paused})

    (declare-pstate s $$current-year
                    Long {:global?       true
                          :initial-value 1958})

    (declare-pstate s $$processing?
                    Boolean {:global?       true
                             :initial-value false})

    (declare-pstate s $$error
                    String {:global?       true
                            :initial-value ""})

    (declare-pstate s $$year-stats
                    {Long ; year
                     (fixed-keys-schema
                      {:year     Long
                       :total    Long
                       :reviewed Long})})

    ;; ---- Tick-driven pipeline ----
    (<<sources s
               (source> *tick)
               (local-select> STAY $$stage :> *stage)
               (<<switch *stage

                         (case> :ingest-celex)
                         (ingest-celex $$all-regulations $$year-stats $$verdicts $$review-queue $$processing? $$current-year $$stage)

                         (case> :invoke-review)
                         (invoke-review $$reviews-by-year $$review-queue $$error-queue $$retry-counts
                                        $$verdicts $$processing? $$current-year $$stage $$year-stats $$error)

                         (default>) nil))

    ;; ---- Control commands ----
    (<<sources s
               (source> *control-depot :> *command)
               (|global)
               (<<switch *command

                         (case> :start)
                         (local-select> STAY $$stage :> *current-stage)
                         (<<if (= *current-stage :paused)
                               (local-transform> (termval :ingest-celex) $$stage)
                               (local-transform> (termval false) $$processing?))

                         (case> :resume)
                         (local-select> STAY $$stage :> *current-stage)
                         (<<if (= *current-stage :paused)
                               (local-transform> (termval :invoke-review) $$stage)
                               (local-transform> (termval false) $$processing?)
                               (local-transform> (termval "") $$error))

                         (case> :reset-processing)
                         (local-transform> (termval false) $$processing?)

                         (default>) nil))

    ;; ---- Query topologies ----
    (<<query-topology topologies "chart-query" [:> *res]
                      (|global)
                      (local-select> STAY $$current-year :> *year)
                      (local-select> STAY $$stage :> *stage)
                      (|all)
                      (local-select> [MAP-VALS] $$year-stats :> *chart-query)
                      (|origin)
                      (+compound {:current-year (aggs/+last *year)
                                  :stage        (aggs/+last *stage)
                                  :years        (aggs/+vec-agg *chart-query)} :> *res))

    (<<query-topology topologies "verdict" [:> *res]
                      (|global)
                      (local-select> :keeps $$verdicts :> *keeps)
                      (local-select> :deletes $$verdicts :> *deletes)
                      (local-select> :total-regulations $$verdicts :> *total-regulations)
                      (local-select> :total-reviews $$verdicts :> *total-reviews)
                      (local-select> :cost-in-ticks $$verdicts :> *cost)
                      (local-select> STAY $$error :> *error)
                      (|origin)
                      (hash-map :keeps *keeps
                                :deletes *deletes
                                :total-regulations *total-regulations
                                :total-reviews *total-reviews
                                :cost-in-ticks *cost
                                :error *error :> *res))

    (<<query-topology topologies "table-reviews-query" [*year :> *res]
                      (|hash *year)
                      (local-select> [(keypath *year) MAP-VALS] $$reviews-by-year :> *review)
                      (|origin)
                      (aggs/+vec-agg *review :> *res))

    (<<query-topology topologies "queue-status" [*year :> *res]
                      (|hash *year)
                      (local-select> [(keypath *year) (view count)] $$review-queue :> *main-count)
                      (local-select> [(keypath *year) (view count)] $$error-queue :> *error-count)
                      (|origin)
                      (hash-map :review-queue-size *main-count
                                :error-queue-size *error-count :> *res))))


;; ============================================================================
;; RAMA CLIENT SETUP
;; ============================================================================

;; Implements the Rama client setup for connecting to and interacting with
;; the MainModule's resources (depots, pstates, and query topologies)
;;
;; Table of Contents:
;; - rama-manager               : Atom holding the Rama manager instance
;; - get-depot                  : Gets a Rama depot client by key
;; - get-pstate                 : Gets a Rama pstate client by key
;; - get-query                  : Gets a Rama query topology client by key
;; - key->depot-name            : Converts key to depot name format (*key)
;; - key->pstate-name           : Converts key to pstate name format ($$key)
;; - key->query-name            : Converts key to query name format (key)
;; - init-depots!               : Initializes depot clients from manager
;; - init-pstates!              : Initializes pstate clients from manager
;; - init-queries!              : Initializes query topology clients from manager
;; - rama-config                : Configuration map for Rama resources
;; - init-rama-resources!       : Initializes all Rama resources for a manager
;; - init-rama!                 : Initialize Rama with either IPC or cluster manager
;; - close-rama!                : Close Rama manager and reset system state

(def rama-manager (atom nil))

(defn get-depot [k]
  (get-in @system [:depot k]))

(defn get-pstate [k]
  (get-in @system [:pstate k]))

(defn get-query [k]
  (get-in @system [:query k]))

(defn key->depot-name [k]
  (str "*" (name k)))

(defn key->pstate-name [k]
  (str "$$" (name k)))

(defn key->query-name [k]
  (name k))

(defn init-depots! [mgr module-name depot-keys]
  (doseq [k depot-keys]
    (swap! system assoc-in [:depot k]
           (foreign-depot mgr module-name (key->depot-name k)))))

(defn init-pstates! [mgr module-name pstate-keys]
  (doseq [k pstate-keys]
    (swap! system assoc-in [:pstate k]
           (foreign-pstate mgr module-name (key->pstate-name k)))))

(defn init-queries! [mgr module-name query-keys]
  (doseq [k query-keys]
    (swap! system assoc-in [:query k]
           (foreign-query mgr module-name (key->query-name k)))))

(def rama-config
  {:module-name "backend.core/MainModule"
   :depots [:regulation-depot :control-depot]
   :pstates [:all-regulations
             :review-queue
             :retry-counts
             :reviews-by-year
             :verdicts
             :stage
             :current-year]
   :queries [:chart-query
             :verdict
             :table-reviews-query
             :queue-status]})

(defn- init-rama-resources!
  "Initialize all Rama resources (depots, pstates, queries) for a given manager."
  [mgr {:keys [module-name depots pstates queries]}]
  (prn "Initing depots")
  (init-depots! mgr module-name depots)

  (prn "Initing pstates")
  (init-pstates! mgr module-name pstates)

  (prn "Initing queries")
  (init-queries! mgr module-name queries))

(defn init-rama!
  "Initialize Rama with either IPC or cluster manager.
   
   Options:
   - :mode - either :ipc or :cluster (default :cluster)
   - :conductor-host - hostname for cluster manager (default \"localhost\")
   - :ipc-opts - map of options for IPC cluster (default {:tasks 4 :threads 2})"
  [& {:keys [mode conductor-host ipc-opts]
      :or {mode :cluster
           conductor-host "localhost"
           ipc-opts {:tasks 4 :threads 2}}}]
  (let [mgr (case mode
              :ipc (let [ipc (rtest/create-ipc)]
                     (rtest/launch-module! ipc backend.core/MainModule ipc-opts)
                     ipc)
              :cluster (open-cluster-manager {"conductor.host" conductor-host})
              (throw (ex-info "Invalid mode. Must be :ipc or :cluster" {:mode mode})))]

    (reset! rama-manager mgr)
    (init-rama-resources! mgr rama-config)

    (prn (str "Rama initialized in " (name mode) " mode!"))
    mgr))

(defn close-rama!
  []
  (when-let [mgr @rama-manager]
    (close! mgr)
    (reset! rama-manager nil)
    (reset! system {:depot {} :pstate {} :query {}})
    (prn "Rama closed!")))

(comment
  ;; Development - IPC mode
  (init-rama! :mode :ipc)

  ;; Production - cluster mode
  (init-rama! :mode :cluster)

  ;; Production with custom conductor host
  (init-rama! :mode :cluster :conductor-host "my-conductor.example.com")

  ;; IPC with custom options
  (init-rama! :mode :ipc :ipc-opts {:tasks 8 :threads 4})

  ;; Close when done
  (close-rama!))



;; ============================================================================
;; EVENT HANDLING & QUERIES
;; ============================================================================

;; Implements the event handling system for processing client requests and
;; interfacing with the Rama module's resources (depots, pstates, and queries)
;;
;; Table of Contents:
;; - -event-handler                : Multimethod for dispatching events by ID
;; - handle-event                  : Main event processing function with error handling
;; - :query/verdicts               : Event handler for fetching verdict statistics
;; - :query/chart-data             : Event handler for fetching chart data (year stats)
;; - :query/table-data             : Event handler for fetching review table data by year


(defmulti -event-handler
  (fn [{:keys [id]}] id))

(defmethod -event-handler :default [{:keys [id]}]
  (throw (ex-info "Unknown event type" {:event id})))

(defn handle-event
  [event]
  (let [id (first event)
        data (second event)
        handler-fn (get-method -event-handler id)]
    (if (= handler-fn (get-method -event-handler :default))
      {:success false :error (str "Unknown action: " id)}
      (try
        (let [result (handler-fn data)]
          {:success true :data result})
        (catch Exception e
          {:status 500
           :body {:success false :error (.getMessage e)}})))))

(defmethod -event-handler :query/verdicts
  [_data]
  (foreign-invoke-query (get-query :verdict)))

(defmethod -event-handler :query/chart-data
  [_data]
  (foreign-invoke-query (get-query :chart-query)))

(defmethod -event-handler :query/table-data
  [{:keys [year]}]
  (foreign-invoke-query (get-query :table-reviews-query) (long year)))


;; ============================================================================
;; ROUTER
;; ============================================================================

(defn static-file-handler [req]
  (let [uri (:uri req)
        file-path (str "public" uri)
        file (io/file file-path)]
    (if (.exists file)
      (let [response (response/file-response file-path)]
        (if (str/ends-with? uri ".svg")
          (assoc-in response [:headers "Content-Type"] "image/svg+xml")
          response))
      {:status 404 :body "Not Found"})))

(defn admin-auth? [req]
  (= (get-in req [:headers "x-admin-token"]) (System/getenv "ADMIN_TOKEN")))

(def routes
  [["/" {:get
         (fn [_]
           {:status 200
            :headers {"Content-Type" "text/html; charset=utf-8"}
            :body (slurp "public/index.html")})}]

   ["/api/event" {:post
                  (fn [req]
                    (let [body (slurp (:body req))
                          [id data] (json/parse-string body true)
                          event [(keyword id) data]
                          result (handle-event event)]
                      {:status 200
                       :headers {"Content-Type" "application/json"}
                       :body (json/generate-string result)}))}]

   ["/api/start" {:post
                  (fn [req]
                    (if-not (admin-auth? req)
                      {:status 403
                       :headers {"Content-Type" "application/json"}
                       :body (json/generate-string {:error "Unauthorized"})}
                      (try
                        (foreign-append! (get-depot :control-depot) :start)
                        {:status 200
                         :headers {"Content-Type" "application/json"}
                         :body (json/generate-string {:success true :message "Start signal sent"})}
                        (catch Exception e
                          {:status 500
                           :headers {"Content-Type" "application/json"}
                           :body (json/generate-string {:success false :error (.getMessage e)})}))))}]

   ["/api/resume" {:post
                   (fn [req]
                     (if-not (admin-auth? req)
                       {:status 403
                        :headers {"Content-Type" "application/json"}
                        :body (json/generate-string {:error "Unauthorized"})}
                       (try
                         (foreign-append! (get-depot :control-depot) :resume)
                         {:status 200
                          :headers {"Content-Type" "application/json"}
                          :body (json/generate-string {:success true :message "Resume signal sent"})}
                         (catch Exception e
                           {:status 500
                            :headers {"Content-Type" "application/json"}
                            :body (json/generate-string {:success false :error (.getMessage e)})}))))}]

   ["/api/reset-processing" {:post
                             (fn [req]
                               (if-not (admin-auth? req)
                                 {:status 403
                                  :headers {"Content-Type" "application/json"}
                                  :body (json/generate-string {:error "Unauthorized"})}
                                 (try
                                   (foreign-append! (get-depot :control-depot) :reset-processing)
                                   {:status 200
                                    :headers {"Content-Type" "application/json"}
                                    :body (json/generate-string {:success true :message "Processing flag reset"})}
                                   (catch Exception e
                                     {:status 500
                                      :headers {"Content-Type" "application/json"}
                                      :body (json/generate-string {:success false :error (.getMessage e)})}))))}]

   ["/backend/publiccode.clj" {:get
                               (fn [_]
                                 {:status 200
                                  :headers {"Content-Type" "text/plain; charset=utf-8"}
                                  :body (slurp "src/backend/publiccode.clj")})}]
   ["/assets/*"
    {:get {:handler static-file-handler
           :name ::static-files}}]])

(defn app []
  (ring/ring-handler
   (ring/router routes)))

;; ============================================================================
;; SERVER
;; ============================================================================

;; Router and ring handler
;;
;; Table of Contents:
;; - server          - gets server from state atom
;; - start-server    - boots server and rama
;; - stop-server     - closes server and rama
;; - -main           - main entry point to app

(defn server []
  (get @system :server))

(defn start-server []
  (when (server) (.stop (server)))
  (init-rama! :mode :ipc)
  (let [port (Integer/parseInt (or (System/getenv "PORT") "1999"))]
    (println "Starting server on port" port)
    (swap! system assoc :server
           (jetty/run-jetty (app)
                            {:port port :join? false}))
    (prn "Server started")))

(defn stop-server []
  (when (server)
    (.stop (server))
    (when @rama-manager (close-rama!))
    (swap! system assoc :server nil)
    (println "Server stopped.")))

(defn -main []
  (start-server))




  raw html:

<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>EU Regulation Review</title>
<link rel="icon" href="/assets/favicon.ico">
<meta property="og:title" content="EU Regulation Review">
<meta property="og:description" content="A live AI review of the entire corpus of EU regulations from 1958-2025">
<meta property="og:image" content="https://bettereu.com/assets/opengraph.png">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="EU Regulation Review">
<meta name="twitter:description" content="A live AI review of the entire corpus of EU regulations from 1958-2025">
<meta name="twitter:image" content="https://bettereu.com/assets/opengraph.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/languages/clojure.min.js"></script>

<style>

*, *::before, *::after { box-sizing: border-box; }

html {
  scrollbar-width: none;
}

html::-webkit-scrollbar {
  display: none;
}

:root {
  --blue: #3b82f6;
  --blue-dark: #1d4ed8;
  --grey-light: #e5e5e5;
  --text: #111;
  --muted: #666;
  --bg: #fafaf8;
}

body {
  margin: 0;
  font-family: 'DM Mono', monospace;
  background: var(--bg);
  overflow-x: hidden;
  scrollbar-width: none;
}

body::-webkit-scrollbar {
  display: none;
}

/* ─── SECTION 1: HERO ─────────────────────────────────────────── */

.hero {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0 clamp(24px, 7vw, 120px);
  position: relative;
  overflow: hidden;
  background: #ffffff;
}

/* Subtle grid background */
.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

/* Glow blob */
.hero::after {
  content: '';
  position: absolute;
  top: -20%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
  pointer-events: none;
}

.hero-eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--blue);
  margin-bottom: 28px;
  opacity: 0;
  animation: fadeUp 0.6s ease forwards 0.2s;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .hero-eyebrow {
    flex-wrap: wrap;
    white-space: normal;
  }
  .eyebrow-sep {
    display: none;
  }
  .eyebrow-delete {
    width: 100%;
    margin-top: 6px;
  }
}

.hero-eyebrow .eyebrow-sep {
  opacity: 0.35;
  margin: 0 8px;
}

#costDisplay {
  color: #111;
  font-weight: 500;
}

.hero-heading {
  font-family: 'Instrument Serif', serif;
  font-size: clamp(44px, 7vw, 96px);
  font-weight: 400;
  line-height: 1.0;
  color: #111;
  margin: 0 0 24px 0;
  max-width: 860px;
  opacity: 0;
  animation: fadeUp 0.7s ease forwards 0.35s;
}

.hero-heading em {
  font-style: italic;
  color: #3b82f6;
}

.hero-subheading {
  font-family: 'DM Mono', monospace;
  font-size: clamp(13px, 1.5vw, 16px);
  font-weight: 300;
  color: rgba(0,0,0,0.45);
  max-width: 560px;
  line-height: 1.7;
  margin: 0 0 72px 0;
  opacity: 0;
  animation: fadeUp 0.7s ease forwards 0.5s;
}

/* ── Progress bar ── */
.progress-wrap {
  width: 100%;
  max-width: 760px;
  opacity: 0;
  animation: fadeUp 0.7s ease forwards 0.65s;
}

.progress-track {
  position: relative;
  height: 3px;
  background: rgba(0,0,0,0.1);
  border-radius: 99px;
  margin-bottom: 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  border-radius: 99px;
  width: 0%;
  transition: width 1.8s cubic-bezier(0.16, 1, 0.3, 1);
}

/* The Grok logo marker */
.progress-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  transition: left 1.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-marker img {
  width: 100%;
  height: 100%;
  display: block;
  animation: pulse 2.5s ease-in-out infinite 2.5s;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.8; }
}

.progress-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.progress-label {
  font-size: 12px;
  color: rgba(0,0,0,0.35);
  letter-spacing: 0.05em;
}

.progress-count {
  font-size: 13px;
  font-weight: 500;
  color: rgba(0,0,0,0.6);
  letter-spacing: 0.04em;
}

.progress-count strong {
  color: #3b82f6;
  font-weight: 500;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* ─── ERROR BANNER ────────────────────────────────────────── */

.error-banner {
  display: none;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.04);
  max-width: 760px;
  width: 100%;
  margin-bottom: 28px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity 0.4s ease, transform 0.4s ease;
  position: relative;
  z-index: 1;
}

.error-banner.visible {
  display: flex;
  opacity: 1;
  transform: translateY(0);
}

.error-banner-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ef4444;
  flex-shrink: 0;
  margin-top: 4px;
  animation: errorPulse 2.4s ease-in-out infinite;
}

@keyframes errorPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.error-banner-body {
  flex: 1;
  min-width: 0;
}

.error-banner-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #ef4444;
  margin-bottom: 4px;
  opacity: 0.8;
}

.error-banner-msg {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: rgba(0,0,0,0.45);
  line-height: 1.6;
  word-break: break-word;
}

/* ─── HERO LAYOUT ─────────────────────────────────────────── */

.hero-inner {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
}

.hero-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.hero-pie-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  opacity: 0;
  animation: fadeIn 0.8s ease forwards 1s;
}

@media (max-width: 768px) {
  .hero-pie-wrap { display: none; }
  .hero-inner { flex-direction: column; align-items: flex-start; gap: 0; }
}

/* Pie chart */
.pie-svg {
  width: 220px;
  height: 220px;
  transform: rotate(-90deg);
  filter: drop-shadow(0 8px 32px rgba(59,130,246,0.12));
}

.pie-track {
  fill: none;
  stroke: #f0f0ee;
  stroke-width: 28;
}

.pie-delete {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 28;
  stroke-linecap: butt;
  transition: stroke-dasharray 1.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.pie-keep {
  fill: none;
  stroke: #e5e5e5;
  stroke-width: 28;
  stroke-linecap: butt;
}

.pie-center-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.pie-container {
  position: relative;
  width: 220px;
  height: 220px;
}

.pie-pct {
  font-family: 'Instrument Serif', serif;
  font-style: italic;
  font-size: 42px;
  color: #3b82f6;
  line-height: 1;
}

.pie-label {
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #aaa;
  margin-top: 4px;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-self: flex-start;
}

.pie-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  color: #888;
}

.pie-legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.section-chart {
  width: 100vw;
  min-height: 100vh;
  background: url("/background.jpg") center/cover no-repeat;
  display: flex;
  flex-direction: column;
}

.overlay {
  background: rgba(255,255,255,0.92);
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.container {
  width: 100%;
  margin: auto;
  padding: 80px clamp(24px, 7vw, 120px) 40px;
  flex: 1;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.chart-header {
  margin-bottom: 40px;
}

.chart-eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--blue);
  margin: 0 0 16px 0;
}

.chart-title {
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  font-size: clamp(28px, 4vw, 48px);
  color: #111;
  margin: 0 0 12px 0;
  line-height: 1.1;
}

.chart-title em {
  font-style: italic;
  color: #3b82f6;
}

.chart-desc {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #999;
  margin: 0;
  max-width: 560px;
  line-height: 1.7;
}

.chart {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  flex: 1;
  min-height: 0;
  height: calc(100vh - 220px);
  overflow-x: auto;
  padding: 40px 0 30px 0;
  scrollbar-width: none;
}

.chart::-webkit-scrollbar {
  display: none;
}

.year-column {
  width: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.bar {
  width: 100%;
  background: #e5e5e5;
  border-radius: 6px;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.progress {
  width: 100%;
  background: #3b82f6;
  border-radius: 6px;
  position: relative;
}

.grok {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 18px;
}

.year-label {
  margin-top: 6px;
  font-size: 10px;
  color: #555;
  font-family: 'DM Mono', monospace;
}

.legend {
  margin-top: 25px;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  font-size: 14px;
  font-family: 'DM Mono', monospace;
}

.legend span {
  width: 16px;
  height: 16px;
  display: inline-block;
  border-radius: 4px;
  margin-right: 6px;
}

/* ─── SECTION 3: VERDICTS TABLE ───────────────────────────────── */

.section-verdicts {
  width: 100%;
  min-height: 100vh;
  background: #fff;
  padding: 80px clamp(24px, 7vw, 120px);
  box-sizing: border-box;
  overflow-x: hidden;
}

.verdicts-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 40px;
}

.verdicts-title-block h2 {
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  font-size: clamp(28px, 4vw, 48px);
  color: #111;
  margin: 0 0 8px 0;
  line-height: 1.1;
}

.verdicts-title-block h2 em {
  font-style: italic;
  color: #3b82f6;
}

.verdicts-title-block p {
  font-size: 12px;
  color: #999;
  margin: 0;
  letter-spacing: 0.05em;
}

/* Year selector */
.year-selector-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}

.year-selector-label {
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #aaa;
}

.year-selector {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  background: #fafaf8;
  max-width: 100%;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.year-selector::-webkit-scrollbar {
  display: none;
}

.year-btn {
  background: none;
  border: none;
  padding: 8px 14px;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  cursor: pointer;
  color: #666;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.year-btn:hover {
  background: #f0f0ee;
  color: #111;
}

.year-btn.active {
  background: #3b82f6;
  color: #fff;
}

.year-btn:not(:last-child) {
  border-right: 1px solid #e5e5e5;
}

/* Stats strip */
.verdicts-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.stat-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  letter-spacing: 0.04em;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-dot.keep { background: #22c55e; }
.stat-dot.delete { background: #ef4444; }
.stat-dot.total { background: #3b82f6; }

.stat-pill strong {
  color: #111;
  font-weight: 500;
}

/* Table wrapper */
.table-wrap {
  width: 100%;
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

table {
  min-width: 700px;
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  font-family: 'DM Mono', monospace;
}

thead tr {
  background: #f5f5f3;
  border-bottom: 1px solid #e5e5e5;
}

thead th {
  padding: 12px 16px;
  text-align: left;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #999;
  white-space: nowrap;
}

tbody tr {
  border-bottom: 1px solid #f0f0ee;
  transition: background 0.1s;
}

tbody tr:last-child {
  border-bottom: none;
}

tbody tr:hover {
  background: #fafaf8;
}

tbody td {
  padding: 14px 16px;
  vertical-align: top;
  color: #333;
  line-height: 1.5;
}

.td-celex {
  white-space: nowrap;
  width: 120px;
}

.celex-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.celex-code {
  color: #888;
  font-size: 11px;
}

.celex-link {
  color: #3b82f6;
  font-size: 11px;
  text-decoration: none;
  letter-spacing: 0.04em;
}

.celex-link:hover {
  text-decoration: underline;
}

.td-verdict {
  width: 80px;
}

.verdict-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.verdict-badge.keep {
  background: #dcfce7;
  color: #15803d;
}

.verdict-badge.delete {
  background: #fee2e2;
  color: #b91c1c;
}


.td-summary, .td-reason {
  max-width: 260px;
}

.truncate {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: #444;
  cursor: default;
}

.truncate:hover {
  -webkit-line-clamp: unset;
  overflow: visible;
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.pagination-info {
  font-size: 12px;
  color: #aaa;
  letter-spacing: 0.04em;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn {
  background: none;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 6px 12px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  cursor: pointer;
  color: #555;
  transition: all 0.15s;
  min-width: 36px;
  text-align: center;
}

.page-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #3b82f6;
}

.page-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ─── SECTION 4: PROMPT ──────────────────────────────────── */

.section-prompt {
  width: 100%;
  background: #fafaf8;
  padding: 80px clamp(24px, 7vw, 120px);
  box-sizing: border-box;
  border-top: 1px solid #e5e5e5;
}

.prompt-header {
  margin-bottom: 40px;
}

.prompt-eyebrow {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--blue);
  margin: 0 0 16px 0;
}

.prompt-title {
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  font-size: clamp(28px, 4vw, 48px);
  color: #111;
  margin: 0 0 12px 0;
  line-height: 1.1;
}

.prompt-title em {
  font-style: italic;
  color: #3b82f6;
}

.prompt-desc {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #999;
  margin: 0;
  max-width: 560px;
  line-height: 1.7;
}

.prompt-block {
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  overflow: hidden;
  max-width: 860px;
}

.prompt-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f5f5f3;
  border-bottom: 1px solid #e5e5e5;
}

.prompt-model-tag {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #aaa;
}

.prompt-copy-btn {
  background: none;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 4px 12px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.prompt-copy-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.prompt-body {
  margin: 0;
  padding: 24px;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  line-height: 1.8;
  color: #333;
  background: #fff;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ─── SECTION 5: CODE ────────────────────────────────────── */

.section-code {
  width: 100%;
  background: #fff;
  padding: 80px clamp(24px, 7vw, 120px);
  box-sizing: border-box;
  border-top: 1px solid #e5e5e5;
}

.code-header {
  margin-bottom: 40px;
}

.code-title {
  font-family: 'Instrument Serif', serif;
  font-weight: 400;
  font-size: clamp(28px, 4vw, 48px);
  color: #111;
  margin: 0 0 12px 0;
  line-height: 1.1;
}

.code-title em {
  font-style: italic;
  color: #3b82f6;
}

.code-desc {
  font-family: 'DM Mono', monospace;
  font-size: 13px;
  color: #999;
  margin: 0;
  max-width: 560px;
  line-height: 1.7;
}

.code-block {
  border: 1px solid #e5e5e5;
  border-radius: 12px;
  overflow: hidden;
  max-width: 1000px;
}

.code-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f5f5f3;
  border-bottom: 1px solid #e5e5e5;
}

.code-filename {
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.1em;
  color: #aaa;
}

.code-copy-btn {
  background: none;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 4px 12px;
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.code-copy-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.code-block pre {
  margin: 0;
  padding: 0;
  background: #fff;
  max-height: 600px;
  overflow: auto;
}

.code-block pre code {
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  line-height: 1.8;
  display: block;
  padding: 24px !important;
  background: #fff !important;
}

.code-loading {
  padding: 48px 24px;
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 12px;
  color: #bbb;
  letter-spacing: 0.05em;
}

/* Empty state */
.empty-state {
  padding: 60px 24px;
  text-align: center;
  color: #bbb;
  font-size: 13px;
  letter-spacing: 0.05em;
}

</style>
</head>

<body>

<!-- ═══════════════════════════════════════════════════
     SECTION 1 — HERO
════════════════════════════════════════════════════ -->
<section class="hero">

  <div class="hero-inner">

    <!-- Left: all existing content -->
    <div class="hero-content">

      <div class="hero-eyebrow">
        <span>Token cost: <span id="costDisplay">$—</span></span>
        <span class="eyebrow-sep">·</span>
        <span class="eyebrow-delete">Deletion recommendation: <span id="deletePctA" style="color:#111;font-weight:500">—</span></span>
      </div>

      <!-- Error banner — shown only when backend reports an error -->
      <div class="error-banner" id="errorBanner" aria-live="polite">
        <div class="error-banner-dot"></div>
        <div class="error-banner-body">
          <div class="error-banner-label">Processing paused</div>
          <div class="error-banner-msg" id="errorMsg"></div>
        </div>
      </div>

      <h1 class="hero-heading">
        The entire corpus of EU regulation,<br><em>reviewed by Grok.</em>
      </h1>

      <p class="hero-subheading">
        A live review of <span id="totalRegsDisplay">140,000</span> regulations by Grok 4.1 and given a simple verdict: KEEP or DELETE.
      </p>

      <!-- Progress indicator -->
      <div class="progress-wrap">
        <div class="progress-track" id="heroTrack">
          <div class="progress-fill" id="heroFill"></div>
          <div class="progress-marker" id="heroMarker">
            <img src="/assets/grok.svg" alt="Grok">
          </div>
        </div>
        <div class="progress-meta">
          <span class="progress-label">1958 ——————— 2025</span>
          <span class="progress-count"><strong id="reviewedCount">0</strong> / <span id="totalCount">41,300</span> total regulations reviewed</span>
        </div>
      </div>

    </div>

    <!-- Right: pie chart -->
    <div class="hero-pie-wrap">
      <div class="pie-container">
        <svg class="pie-svg" viewBox="0 0 100 100">
          <circle class="pie-track" cx="50" cy="50" r="36"/>
          <circle class="pie-keep"   cx="50" cy="50" r="36" stroke-dasharray="226.2 226.2" stroke-dashoffset="0"/>
          <circle class="pie-delete" cx="50" cy="50" r="36" stroke-dasharray="0 226.2"/>
        </svg>
        <div class="pie-center-text">
          <span class="pie-pct" id="piePct">—</span>
          <span class="pie-label">deleted</span>
        </div>
      </div>
      <div class="pie-legend">
        <div class="pie-legend-item"><div class="pie-legend-dot" style="background:#3b82f6"></div>Recommend delete</div>
        <div class="pie-legend-item"><div class="pie-legend-dot" style="background:#e5e5e5"></div>Recommend keep</div>
      </div>
    </div>

  </div>

</section>


<!-- ═══════════════════════════════════════════════════
     SECTION 2 — CHART
════════════════════════════════════════════════════ -->
<section class="section-chart">
<div class="overlay">
<div class="container">

<div class="chart-header">
  <p class="chart-eyebrow">1958 — 2025</p>
  <h2 class="chart-title">Regulations, <em>by year</em></h2>
  <p class="chart-desc">Every EU regulation plotted by year of enactment — blue shows what Grok has reviewed so far.</p>
</div>

<div class="chart" id="chartContainer"></div>

<div class="legend">
<div><span style="background:#e5e5e5"></span>Total regulations</div>
<div><span style="background:#3b82f6"></span>Reviewed</div>
<div><img src="/assets/grok.svg" width="16"> Current LLM position</div>
</div>

</div>
</div>
</section>


<!-- ═══════════════════════════════════════════════════
     SECTION 3 — VERDICTS TABLE
════════════════════════════════════════════════════ -->
<section class="section-verdicts">

  <div class="verdicts-header">
    <div class="verdicts-title-block">
      <h2>Regulation <em>verdicts</em></h2>
      <p>Keep · Delete · AI-generated review per regulation</p>
    </div>
    <div class="year-selector-wrap">
      <span class="year-selector-label">Filter by year</span>
      <div class="year-selector" id="yearSelector"></div>
    </div>
  </div>

  <div class="verdicts-stats" id="verdictsStats"></div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Regulation</th>
          <th>Verdict</th>
          <th>Summary</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody id="verdictsBody"></tbody>
    </table>
    <div class="empty-state" id="emptyState" style="display:none">
      No verdicts available for this year yet.
    </div>
  </div>

  <div class="pagination" id="pagination"></div>

</section>


<!-- ═══════════════════════════════════════════════════
     SECTION 4 — PROMPT
════════════════════════════════════════════════════ -->
<section class="section-prompt">

  <div class="prompt-header">
    <p class="prompt-eyebrow">Open Source</p>
    <h2 class="prompt-title">The <em>prompt</em></h2>
    <p class="prompt-desc">The exact system prompt given to Grok for every regulation review.</p>
  </div>

  <div class="prompt-block">
    <div class="prompt-toolbar">
      <span class="prompt-model-tag">grok-4.1</span>
      <button class="prompt-copy-btn" onclick="copyPrompt(this)">Copy</button>
    </div>
    <pre class="prompt-body" id="promptText">You are the head of Better EU, a fictional agency who's members are all trained on the works of Ludwig Von Mises, Hayek, and Milton Friedman, and are tasked with the ambitious objective of reviewing all of the EU's current regulations with the goal of assessing which should be deleted in their entirety. 

Your moral thrust is to get the European continent back onto the world stage in terms of wealth, prosperity, individualism, liberty, and greatness. You recognise, as those aforementioned economists did, that:

   * Wealth is created not by decree but by liberty and private property
   
   * That the rhetoric of politicians rarely, if ever, translates into effective action at improving the lot of the poor, so should always be treated as suspect and not taken at face value
   
   * That institutions matter more than desired outcomes. One cannot wish things into existence or declare that things will be so. The institutions for creating those outcomes have to be in place and always have a life of their own. For instance, 'tax the rich to help the poor' is an outcome many people ask for without specifying the institutions that will ensure that A - the rich won't just leave and B - that the poor will actually receive the benefits
   
   * That regulations, as an institution, are set up to achieve one thing but always have unintended consequences, such as distorting incentives, reducing supply, increasing costs, creating monopolies, and sometimes hurting people directly by withholding better options, and that the desired goal of a regulation *must* be weighed against the unintended costs.
   

You will be given one EU regulation at a time and are to return a clojure map with these fields: 
 {:summary 'summary-of-regulation', :verdict 'keep/delete', :reason 'reason for verdict'}. 
   
   If your verdict is 'keep', your reason must be succinct and address the question of: why would European citizens be worse off if this regulation was deleted, and why you think that this regulation must therefore be achieving its desired outcome in a way that would not happen without it. 
   
   If your verdict is 'delete', your reason must be succinct and address the costs of keeping this regulation on the books, accounting for the nonobvious unseen consequences.

Regulation: </pre>
  </div>

</section>

<!-- ═══════════════════════════════════════════════════
     SECTION 5 — CODE
════════════════════════════════════════════════════ -->
<section class="section-code">

  <div class="code-header">
    <p class="prompt-eyebrow">Open Source</p>
    <h2 class="code-title">The <em>code</em></h2>
    <p class="code-desc">A single .clj file containing the core app</p>
  </div>

  <div class="code-block">
    <div class="code-toolbar">
      <span class="code-filename">core.clj</span>
      <button class="code-copy-btn" id="codeCopyBtn" onclick="copyCode(this)">Copy</button>
    </div>
    <pre id="codeBlock"><div class="code-loading">Loading...</div></pre>
  </div>

</section>

<script>
  // ══════════════════════════════════════════════════════════════
  //  HERO PROGRESS
  // ══════════════════════════════════════════════════════════════
  const fill   = document.getElementById('heroFill');
  const marker = document.getElementById('heroMarker');
  const countEl  = document.getElementById('reviewedCount');
  const totalEl  = document.getElementById('totalCount');
  const errorBanner = document.getElementById('errorBanner');
  const errorMsg    = document.getElementById('errorMsg');

  let displayedReviewed = 0;
  let isFirstLoad = true;
  let currentError = null;

  const TICKS_TO_USD = 0.0000000001; // 1 tick = 1/10,000,000,000 USD

  function setError(msg) {
    const hasError = msg && msg.trim().length > 0;
    if (hasError) {
      if (currentError !== msg) {
        currentError = msg;
        errorMsg.textContent = msg;
        errorBanner.style.display = 'flex';
        // One frame delay so the browser registers display:flex before animating opacity
        requestAnimationFrame(() => errorBanner.classList.add('visible'));
      }
    } else {
      if (currentError !== null) {
        currentError = null;
        errorBanner.classList.remove('visible');
        // Hide from layout after transition completes
        errorBanner.addEventListener('transitionend', () => {
          if (!errorBanner.classList.contains('visible')) {
            errorBanner.style.display = 'none';
          }
        }, { once: true });
      }
    }
  }

function updateHero(reviewed, total, costInTicks) {
  const pct = total > 0 ? Math.min(reviewed / total, 1) : 0;
  totalEl.textContent = total.toLocaleString();
  document.getElementById('totalRegsDisplay').textContent = total.toLocaleString();
  fill.style.width  = (pct * 100) + '%';
  marker.style.left = (pct * 100) + '%';

  // Format cost
  if (costInTicks != null) {
    const usd = costInTicks * TICKS_TO_USD;
    // Show enough significant figures — cost will be tiny at first
    let formatted;
    if (usd === 0) {
      formatted = '$0.00';
    } else if (usd < 0.000001) {
      formatted = '$' + usd.toExponential(2);          // e.g. $1.31e-5
    } else if (usd < 0.01) {
      formatted = '$' + usd.toFixed(8).replace(/0+$/, ''); // e.g. $0.00001310
    } else {
      formatted = '$' + usd.toFixed(4);
    }
    document.getElementById('costDisplay').textContent = formatted;
  }

    if (isFirstLoad) {
      // Animate count up on first load
      isFirstLoad = false;
      const startVal = 0;
      const duration = 1800;
      const startTime = performance.now();
      function tick(now) {
        const t = Math.min((now - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        countEl.textContent = Math.round(ease * reviewed).toLocaleString();
        displayedReviewed = Math.round(ease * reviewed);
        if (t < 1) requestAnimationFrame(tick);
      }
      setTimeout(() => requestAnimationFrame(tick), 800);
    } else {
      // Subsequent updates: just set the value
      countEl.textContent = reviewed.toLocaleString();
      displayedReviewed = reviewed;
    }
  }

  function fetchVerdicts() {
  fetch('/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(["query/verdicts", null])
  })
  .then(r => r.json())
  .then(res => {
    if (res.success && res.data) {
      const d = res.data;
      const reviewed  = d["total-reviews"]     || 0;
      const total     = d["total-regulations"] || 0;
      const costTicks = d["cost-in-ticks"]     ?? null;
      const error     = d["error"]             || null;
      const deletes   = d["deletes"]     || 0;
      const deletePct = reviewed > 0 ? Math.round((deletes / reviewed) * 100) : null;
      updateHero(reviewed, total, costTicks);
      setError(error);
      updateDeletePct(deletePct);
    }
  })
  .catch(err => console.error('Failed to fetch verdicts:', err));
}

  function updateDeletePct(pct) {
    const val = pct !== null ? pct + '%' : '—';
    ['deletePctA'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });

    // Update pie chart
    const piePctEl = document.getElementById('piePct');
    if (piePctEl) piePctEl.textContent = val;

    const circumference = 2 * Math.PI * 36; // r=36 → ~226.2
    const deleteArc = pct !== null ? (pct / 100) * circumference : 0;
    const keepArc   = circumference - deleteArc;

    const deleteSlice = document.querySelector('.pie-delete');
    const keepSlice   = document.querySelector('.pie-keep');
    if (deleteSlice) deleteSlice.setAttribute('stroke-dasharray', `${deleteArc.toFixed(2)} ${circumference.toFixed(2)}`);
    if (keepSlice)   keepSlice.setAttribute('stroke-dasharray',   `${keepArc.toFixed(2)} ${circumference.toFixed(2)}`);
    // Offset keep slice to start where delete ends
    if (keepSlice)   keepSlice.setAttribute('stroke-dashoffset',  `${-deleteArc.toFixed(2)}`);
  }

  // Initial fetch + poll every 5 seconds
  fetchVerdicts();
  setInterval(fetchVerdicts, 5000);

  // ══════════════════════════════════════════════════════════════
  //  CHART
  // ══════════════════════════════════════════════════════════════
  const MIN_BAR_PX = 20;
  const MAX_BAR_PX = 400;
  const chartEl = document.getElementById('chartContainer');

  function renderChart(data) {
    const currentYear = data["current-year"];
    const stage = data["stage"];
    const years = data["years"]; // array of {year, total, reviewed}

    // Build a lookup by year
    const byYear = {};
    years.forEach(y => { byYear[y.year] = y; });

    // Find max total for scaling
    const maxTotal = Math.max(1, ...years.map(y => y.total));

    chartEl.innerHTML = '';

    for (let y = 1958; y <= 2025; y++) {
      const info = byYear[y];
      const total = info ? info.total : 0;
      const reviewed = info ? info.reviewed : 0;

      // Scale bar height
      const barH = total > 0
        ? Math.max(MIN_BAR_PX, Math.round((total / maxTotal) * MAX_BAR_PX))
        : MIN_BAR_PX;

      // Progress height as proportion of bar
      const progH = (total > 0 && reviewed > 0)
        ? Math.max(2, Math.round((reviewed / total) * barH))
        : 0;

      // Is Grok currently on this year?
      const isActive = (y === currentYear && stage === "invoke-review");

      const col = document.createElement('div');
      col.className = 'year-column';

      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = barH + 'px';

      if (progH > 0) {
        const prog = document.createElement('div');
        prog.className = 'progress';
        prog.style.height = progH + 'px';

        if (isActive) {
          const img = document.createElement('img');
          img.src = '/assets/grok.svg';
          img.className = 'grok';
          prog.appendChild(img);
        }

        bar.appendChild(prog);
      } else if (isActive) {
        // Active year but no reviews yet — still show grok on the bar
        const prog = document.createElement('div');
        prog.className = 'progress';
        prog.style.height = '2px';
        const img = document.createElement('img');
        img.src = '/assets/grok.svg';
        img.className = 'grok';
        prog.appendChild(img);
        bar.appendChild(prog);
      }

      const label = document.createElement('div');
      label.className = 'year-label';
      label.textContent = String(y).slice(2);

      col.appendChild(bar);
      col.appendChild(label);
      chartEl.appendChild(col);
    }
  }

  function fetchChartData() {
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(["query/chart-data", null])
    })
    .then(r => r.json())
    .then(res => {
      if (res.success && res.data) {
        renderChart(res.data);
        updateAvailableYears(res.data["years"] || []);
      }
    })
    .catch(err => console.error('Failed to fetch chart data:', err));
  }

  fetchChartData();
  setInterval(fetchChartData, 5000);

  // ══════════════════════════════════════════════════════════════
  //  VERDICTS TABLE
  // ══════════════════════════════════════════════════════════════
  const PAGE_SIZE = 15;
  let tableYear = null;
  let tableData = [];   // current year's rows
  let tablePage = 1;
  let tableAvailableYears = [];

  // Called by chart fetch to keep year selector in sync
  function updateAvailableYears(chartYears) {
    const years = chartYears
      .filter(y => y.reviewed > 0)
      .map(y => y.year)
      .sort((a, b) => a - b);

    // Only rebuild if years changed
    if (JSON.stringify(years) === JSON.stringify(tableAvailableYears)) return;
    tableAvailableYears = years;

    if (!tableYear && years.length > 0) {
      tableYear = years[0];
      fetchTableData(tableYear);
    }
    buildYearSelector();
  }

  function buildYearSelector() {
    const wrap = document.getElementById('yearSelector');
    wrap.innerHTML = '';
    tableAvailableYears.forEach(y => {
      const btn = document.createElement('button');
      btn.className = 'year-btn' + (y === tableYear ? ' active' : '');
      btn.textContent = y;
      btn.onclick = () => {
        tableYear = y;
        tablePage = 1;
        buildYearSelector();
        fetchTableData(y);
      };
      wrap.appendChild(btn);
    });
  }

  function fetchTableData(year) {
    fetch('/api/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(["query/table-data", { year: year }])
    })
    .then(r => r.json())
    .then(res => {
      if (res.success) {
        tableData = res.data || [];
        renderTable();
      }
    })
    .catch(err => console.error('Failed to fetch table data:', err));
  }

  function renderStats(rows) {
    const keeps   = rows.filter(r => r.verdict === 'keep').length;
    const deletes = rows.filter(r => r.verdict === 'delete').length;
    const el = document.getElementById('verdictsStats');
    el.innerHTML = `
      <div class="stat-pill"><div class="stat-dot total"></div><strong>${rows.length}</strong>&nbsp;regulations reviewed</div>
      <div class="stat-pill"><div class="stat-dot keep"></div><strong>${keeps}</strong>&nbsp;keep</div>
      <div class="stat-pill"><div class="stat-dot delete"></div><strong>${deletes}</strong>&nbsp;delete</div>
    `;
  }

  function renderTable() {
    const totalPages = Math.ceil(tableData.length / PAGE_SIZE);
    const pageRows = tableData.slice((tablePage - 1) * PAGE_SIZE, tablePage * PAGE_SIZE);

    renderStats(tableData);

    const tbody = document.getElementById('verdictsBody');
    const empty = document.getElementById('emptyState');

    if (tableData.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      tbody.innerHTML = pageRows.map(r => `
        <tr>
          <td class="td-celex">
            <div class="celex-stack">
              <span class="celex-code">${escHtml(r.celex)}</span>
              <a class="celex-link" href="${escHtml(r.url)}" target="_blank" rel="noopener">Link</a>
            </div>
          </td>
          <td class="td-verdict">
            <span class="verdict-badge ${r.verdict}">${r.verdict}</span>
          </td>
          <td class="td-summary"><div class="truncate" title="${escHtml(r.summary)}">${escHtml(r.summary)}</div></td>
          <td class="td-reason"><div class="truncate" title="${escHtml(r.reason)}">${escHtml(r.reason)}</div></td>
        </tr>
      `).join('');
    }

    renderPagination(tableData.length, totalPages);
  }

  function renderPagination(total, totalPages) {
    const el = document.getElementById('pagination');
    const from = Math.min((tablePage - 1) * PAGE_SIZE + 1, total);
    const to   = Math.min(tablePage * PAGE_SIZE, total);

    if (total === 0) { el.innerHTML = ''; return; }

    let pages = [];
    if (totalPages <= 7) {
      pages = Array.from({length: totalPages}, (_, i) => i + 1);
    } else {
      pages = [1];
      if (tablePage > 3) pages.push('…');
      for (let p = Math.max(2, tablePage - 1); p <= Math.min(totalPages - 1, tablePage + 1); p++) pages.push(p);
      if (tablePage < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }

    const pageButtons = pages.map(p => {
      if (p === '…') return `<span class="page-btn" style="border:none;cursor:default;color:#ccc">…</span>`;
      return `<button class="page-btn ${p === tablePage ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
    }).join('');

    el.innerHTML = `
      <span class="pagination-info">Showing ${from}–${to} of ${total}</span>
      <div class="pagination-controls">
        <button class="page-btn" onclick="goPage(${tablePage - 1})" ${tablePage === 1 ? 'disabled' : ''}>←</button>
        ${pageButtons}
        <button class="page-btn" onclick="goPage(${tablePage + 1})" ${tablePage === totalPages ? 'disabled' : ''}>→</button>
      </div>
    `;
  }

  function goPage(p) {
    tablePage = p;
    renderTable();
    document.querySelector('.section-verdicts').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ══════════════════════════════════════════════════════════════
  //  CODE SECTION
  // ══════════════════════════════════════════════════════════════
  fetch('/backend/public.clj')
    .then(r => {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    })
    .then(src => {
      const pre = document.getElementById('codeBlock');
      const code = document.createElement('code');
      code.className = 'language-clojure';
      code.textContent = src;
      pre.innerHTML = '';
      pre.appendChild(code);
      hljs.highlightElement(code);
    })
    .catch(() => {
      document.getElementById('codeBlock').innerHTML =
        '<div class="code-loading">Could not load publiccode.clj</div>';
      document.getElementById('codeCopyBtn').disabled = true;
    });

  function copyCode(btn) {
    const code = document.querySelector('#codeBlock code');
    if (!code) return;
    navigator.clipboard.writeText(code.textContent).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1800);
    });
  }

  function copyPrompt(btn) {
    const text = document.getElementById('promptText').textContent;
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = 'Copy', 1800);
    });
  }

  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Init ──────────────────────────────────────────────────────
  buildYearSelector();
</script>

</body>
</html>
