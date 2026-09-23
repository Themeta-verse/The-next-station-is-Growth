export type ResourceSourceType =
  | 'official_doc'
  | 'institution'
  | 'industry_standard'
  | 'verified_educator';

export interface LearningResource {
  title: string;
  source: string; // E.g., "MIT OpenCourseWare", "Striver A2Z Sheet", "NeetCode", "MDN Web Docs", "GeeksforGeeks"
  provider?: string;
  type: 'video' | 'article' | 'documentation' | 'interactive';
  duration: string;
  estimatedMinutes: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  url: string;
  whyRecommended: string;
  concept?: string;
  subtopic?: string;
  language: 'English' | 'Hindi' | 'Bilingual';
  lastVerified: string;
  sourceType: ResourceSourceType;
  prerequisites: string[];
  completionCriteria?: string;
}

export interface LearningCurriculumItem {
  id: string;
  topicName: string;
  domain: 'engineering' | 'commerce' | 'arts' | 'general';
  category: string;
  misconception: string;
  conceptSummary: string[];
  keyFormulasOrRules?: string[];
  prerequisites: string[];
  resources: LearningResource[];
  practiceDrills: { prompt: string; hint: string }[];
  checkpointQuestions?: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }[];
}

export const LEARNING_CURRICULUM: LearningCurriculumItem[] = [
  // --- DSA: BINARY SEARCH & COMPLEXITY ---
  {
    id: 'dsa-binary-search-complexity',
    topicName: 'Binary Search & Complexity Analysis',
    domain: 'engineering',
    category: 'Data Structures & Algorithms',
    misconception:
      'Students frequently confuse logarithmic time O(log n) with linear time O(n) or assume binary search operates correctly on unsorted collections.',
    conceptSummary: [
      'Binary search requires a monotonically sorted search space (or monotonic predicate function) where each evaluation cuts the remaining search space by 50%.',
      'The recurrence relation is T(n) = T(n/2) + O(1), which solves by Master Theorem to O(log₂ n) time complexity.',
      'Space complexity is O(1) iterative or O(log n) recursive due to call stack memory allocations.',
    ],
    keyFormulasOrRules: [
      'mid = left + Math.floor((right - left) / 2) to eliminate 32-bit signed integer overflow.',
      'Total operations on n items: ⌈log₂ n⌉. For 1,000,000 items, at most 20 comparison steps.',
    ],
    prerequisites: ['Arrays & Contiguous Memory', 'Big-O Asymptotic Complexity', 'Two Pointers / Indexing Bounds'],
    resources: [
      {
        title: 'Binary Search Algorithm Guide & Boundary Cases',
        source: 'GeeksforGeeks',
        provider: 'GeeksforGeeks Technical Editorial',
        type: 'documentation',
        duration: '12 min',
        estimatedMinutes: 12,
        level: 'Beginner',
        url: 'https://www.geeksforgeeks.org/binary-search/',
        whyRecommended: 'Complete authoritative implementations in C++, Java, and Python with boundary conditions.',
        concept: 'Binary Search',
        subtopic: 'Exact Match & Boundaries',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'industry_standard',
        prerequisites: ['Arrays', 'Time Complexity'],
        completionCriteria: 'Implement lower_bound and upper_bound in under 5 minutes without off-by-one errors.',
      },
      {
        title: 'Binary Search Invariant Blueprint & Common Traps',
        source: 'NeetCode',
        provider: 'NeetCode Algorithms',
        type: 'video',
        duration: '15 min',
        estimatedMinutes: 15,
        level: 'Intermediate',
        url: 'https://neetcode.io/practice',
        whyRecommended: 'Visually traces mid calculation, search space termination invariants, and infinite loop bugs.',
        concept: 'Binary Search',
        subtopic: 'Search in Rotated Sorted Array',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'verified_educator',
        prerequisites: ['Arrays', 'Two Pointers'],
        completionCriteria: 'Solve search in rotated sorted array with 100% test case pass rate.',
      },
      {
        title: 'Asymptotic Analysis & Recurrence Relations (Lecture 1)',
        source: 'MIT OpenCourseWare',
        provider: 'MIT EECS 6.006 Introduction to Algorithms',
        type: 'documentation',
        duration: '25 min',
        estimatedMinutes: 25,
        level: 'Intermediate',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        whyRecommended: 'Rigorous mathematical proof of divide-and-conquer recurrences and call-stack space bounds.',
        concept: 'Complexity Analysis',
        subtopic: 'Recurrence Trees & Master Theorem',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'institution',
        prerequisites: ['Math & Logarithms', 'Recursion'],
        completionCriteria: 'Derive recurrence tree depth and total work per level for T(n) = T(n/2) + O(1).',
      },
    ],
    practiceDrills: [
      {
        prompt: 'Implement search in a rotated sorted array in O(log n) time without linear scan.',
        hint: 'Identify whether the left half [left..mid] or right half [mid..right] is sorted, then determine if target lies in that sorted range.',
      },
      {
        prompt: 'Find the first and last position of a given target element in a sorted array (find lower and upper bounds).',
        hint: 'Execute two binary search passes: the first biases left when nums[mid] === target, the second biases right.',
      },
    ],
    checkpointQuestions: [
      {
        question: 'What is the maximum number of comparisons required to find an element in a sorted array of 1,048,576 elements using binary search?',
        options: ['20', '1,048', '524,288', '1,048,576'],
        correct: 0,
        explanation: 'log₂(1,048,576) = log₂(2²⁰) = 20 comparisons in worst-case.',
      },
      {
        question: 'Why is mid computed as left + (right - left) / 2 instead of (left + right) / 2?',
        options: [
          'It is computationally faster on x86 processors.',
          'It prevents integer overflow when (left + right) exceeds the maximum 32-bit signed integer limit.',
          'It handles negative floating-point numbers automatically.',
          'It ensures recursive call stack optimization.',
        ],
        correct: 1,
        explanation: 'When left and right are large (near 2^31 - 1), their sum exceeds 32-bit integer limits, causing signed overflow to negative values.',
      },
      {
        question: 'Under what condition does standard binary search fail to guarantee O(log n) time complexity?',
        options: [
          'When elements are sorted in non-decreasing order with duplicate values.',
          'When the array contains negative integers.',
          'When the underlying data structure does not support O(1) random-access indexing (e.g., a Singly Linked List).',
          'When the total number of elements is odd.',
        ],
        correct: 2,
        explanation: 'On a linked list, finding the middle element takes O(n), destroying logarithmic speed: T(n) = O(n) + T(n/2) = O(n).',
      },
    ],
  },

  // --- DSA: ARRAYS & TWO POINTERS ---
  {
    id: 'dsa-arrays-two-pointers',
    topicName: 'Arrays, Two Pointers & Sliding Window Patterns',
    domain: 'engineering',
    category: 'Data Structures & Algorithms',
    misconception:
      'Students frequently write nested O(n²) loops for subarray problems when a two-pointer or sliding window technique yields O(n) time and O(1) auxiliary space.',
    conceptSummary: [
      'Two pointers moving towards each other allow O(n) verification on sorted collections (e.g. Two Sum sorted).',
      'Sliding window dynamically expands the right pointer to include elements and contracts the left pointer when constraints are violated.',
      'Prefix sums allow O(1) range sum queries after O(n) pre-computation.',
    ],
    keyFormulasOrRules: [
      'Subarray sum [i..j] = prefix[j + 1] - prefix[i]',
      'Total contiguous subarrays of array of length n = n * (n + 1) / 2',
    ],
    prerequisites: ['Arrays', 'Hash Maps', 'Time Complexity'],
    resources: [
      {
        title: 'Two Pointers & Sliding Window Algorithm Patterns',
        source: 'TakeUForward (Striver)',
        provider: 'Striver A2Z Placement Curriculum',
        type: 'article',
        duration: '20 min',
        estimatedMinutes: 20,
        level: 'Beginner',
        url: 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2/',
        whyRecommended: 'Clear step-by-step illustrations of dynamic window expansion, shrinking, and constraint tracking.',
        concept: 'Two Pointers',
        subtopic: 'Sliding Window',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'verified_educator',
        prerequisites: ['Arrays'],
        completionCriteria: 'Solve longest substring without repeating characters in O(n) time.',
      },
      {
        title: 'Two Pointers Technique Overview & Exercises',
        source: 'LeetCode Explore',
        provider: 'LeetCode Engineering Practice',
        type: 'interactive',
        duration: '25 min',
        estimatedMinutes: 25,
        level: 'Intermediate',
        url: 'https://leetcode.com/explore/',
        whyRecommended: 'Hands-on interactive drills for container with most water and 3Sum problems.',
        concept: 'Two Pointers',
        subtopic: 'Bidirectional Pointers',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'industry_standard',
        prerequisites: ['Sorting', 'Arrays'],
        completionCriteria: 'Clear 3Sum with no duplicate triplets in O(n²).',
      },
    ],
    practiceDrills: [
      {
        prompt: 'Find maximum length of contiguous subarray with sum at most K containing non-negative numbers.',
        hint: 'Use sliding window: expand right adding nums[right]. While currentSum > K, subtract nums[left] and increment left.',
      },
    ],
    checkpointQuestions: [
      {
        question: 'What is the time complexity of the classic two-pointer approach to solve 2Sum on an already sorted array?',
        options: ['O(n²)', 'O(n log n)', 'O(n)', 'O(1)'],
        correct: 2,
        explanation: 'Each step increments left or decrements right; each element is visited at most once, taking O(n) total time.',
      },
      {
        question: 'Which problem pattern is NOT suitable for the fixed-size sliding window technique?',
        options: [
          'Maximum sum of any contiguous subarray of size k.',
          'Count of anagram substrings of length equal to pattern p.',
          'Shortest path in an unweighted directed cyclic graph.',
          'Average of all contiguous subarrays of size k.',
        ],
        correct: 2,
        explanation: 'Shortest path in a graph requires BFS (Breadth-First Search) or Dijkstra, not sliding window.',
      },
    ],
  },

  // --- DSA: SORTING & TREES ---
  {
    id: 'dsa-sorting-trees',
    topicName: 'Sorting Algorithms & Tree Properties',
    domain: 'engineering',
    category: 'Data Structures & Algorithms',
    misconception:
      'Students assume QuickSort is always O(n log n) without considering worst-case pivot degradation to O(n²), or confuse tree edge formula (n - 1) with node formulas.',
    conceptSummary: [
      'Merge Sort guarantees O(n log n) in all cases (worst, average, best) by dividing and conquering, requiring O(n) auxiliary memory.',
      'QuickSort achieves O(n log n) average with O(log n) in-place stack, but degrades to O(n²) if pivots are badly chosen on sorted inputs.',
      'In any tree with n vertices, exactly n - 1 edges exist because every node except the root has exactly one incoming parent edge.',
    ],
    keyFormulasOrRules: [
      'Edges = Nodes - 1 (Trees are connected acyclic graphs)',
      'Merge Sort Recurrence: T(n) = 2T(n/2) + O(n) = O(n log n)',
      'Maximum nodes at depth d (root at depth 0): 2ᵈ for binary trees.',
    ],
    prerequisites: ['Recursion', 'Divide and Conquer', 'Graph & Tree Terminology'],
    resources: [
      {
        title: 'Sorting Algorithms Explained with Animations',
        source: 'Abdul Bari',
        provider: 'Prof. Abdul Bari Algorithms Series',
        type: 'video',
        duration: '22 min',
        estimatedMinutes: 22,
        level: 'Intermediate',
        url: 'https://www.youtube.com/@abdul_bari',
        whyRecommended: 'The gold standard for Indian placement preparation, recurrence trees, and partition tracing.',
        concept: 'Divide and Conquer',
        subtopic: 'QuickSort vs MergeSort',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'verified_educator',
        prerequisites: ['Recursion'],
        completionCriteria: 'Trace partition algorithm on an array with duplicate elements.',
      },
      {
        title: 'Binary Trees Properties, Formulas & Traversals',
        source: 'GateSmashers',
        provider: 'GateSmashers Computer Science',
        type: 'video',
        duration: '16 min',
        estimatedMinutes: 16,
        level: 'Beginner',
        url: 'https://www.youtube.com/@GateSmashers',
        whyRecommended: 'Hindi/English explanations tailored for campus MCQs, edge calculations, and tree proofs.',
        concept: 'Tree Properties',
        subtopic: 'Height, Depth, Node-Edge Theorems',
        language: 'Bilingual',
        lastVerified: '2025-01',
        sourceType: 'verified_educator',
        prerequisites: ['Graphs & Trees'],
        completionCriteria: 'Calculate tree height and diameter from node relations.',
      },
    ],
    practiceDrills: [
      {
        prompt: 'Prove why Merge Sort is stable while standard QuickSort is unstable.',
        hint: 'Consider duplicate keys during the merge step vs during pivot partition swaps over long distances.',
      },
    ],
    checkpointQuestions: [
      {
        question: 'A connected undirected graph has 14 vertices and 13 edges without cycles. What is this graph?',
        options: ['A Bipartite Complete Graph', 'A Tree', 'A Hamiltonian Cycle', 'A Directed Acyclic Graph'],
        correct: 1,
        explanation: 'Any connected graph with n vertices and n - 1 edges is strictly a Tree.',
      },
      {
        question: 'What is the worst-case space complexity of recursive Merge Sort on an array of length n?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'],
        correct: 2,
        explanation: 'Merge Sort requires O(n) auxiliary array buffer space to merge sorted halves.',
      },
    ],
  },

  // --- DSA: GRAPHS & LRU CACHE ---
  {
    id: 'dsa-graphs-cache',
    topicName: 'Graph Cycle Detection & LRU Cache Architecture',
    domain: 'engineering',
    category: 'Data Structures & Algorithms',
    misconception:
      'Students use undirected cycle algorithms (simple visited set) on directed graphs, missing that a node can be visited via multiple paths without forming a cycle.',
    conceptSummary: [
      'Directed graph cycle detection requires tracking the current recursion stack (3-color DFS: White=unvisited, Gray=in current stack, Black=completed) or Kahn Algorithm (indegree BFS).',
      'LRU Cache requires O(1) get and O(1) put. A Hash Map gives O(1) key-to-node lookup, while a Doubly Linked List (DLL) gives O(1) node removal and insertion at head.',
      'Dynamic arrays (Vector/ArrayList) have O(1) amortized insertion because doubling capacity every n operations spreads the O(n) copy cost over n items.',
    ],
    keyFormulasOrRules: [
      'Amortized cost = (Total cost of n operations) / n = O(1)',
      'LRU Cache: HashMap<Key, Node> + Doubly Linked List with dummy head & tail pointers',
    ],
    prerequisites: ['Doubly Linked List', 'Hash Tables', 'DFS & BFS'],
    resources: [
      {
        title: 'LRU Cache Design (LeetCode 146) Step-by-Step',
        source: 'NeetCode',
        provider: 'NeetCode Core Architecture',
        type: 'video',
        duration: '16 min',
        estimatedMinutes: 16,
        level: 'Advanced',
        url: 'https://neetcode.io/practice',
        whyRecommended: 'Asked directly at Google, Amazon, Microsoft, and Uber in technical screening rounds.',
        concept: 'System & Data Structures',
        subtopic: 'O(1) Memory Caching',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'industry_standard',
        prerequisites: ['Doubly Linked List', 'Hash Map'],
        completionCriteria: 'Code LRU Cache with dummy head and tail pointers handling evictions without NPE.',
      },
      {
        title: 'Graph Cycle Detection: Directed vs Undirected',
        source: 'Striver A2Z Sheet',
        provider: 'TakeUForward Data Structures',
        type: 'article',
        duration: '18 min',
        estimatedMinutes: 18,
        level: 'Intermediate',
        url: 'https://takeuforward.org/data-structure/detect-cycle-in-a-directed-graph-using-dfs-g-19/',
        whyRecommended: 'Detailed illustrations differentiating back edges from cross edges in directed graph DFS.',
        concept: 'Graph Algorithms',
        subtopic: 'Cycle Detection & Topological Sort',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'verified_educator',
        prerequisites: ['DFS', 'Graph Representations'],
        completionCriteria: 'Distinguish cycle detection in directed graphs from undirected graphs.',
      },
    ],
    practiceDrills: [
      {
        prompt: 'Why does LRU Cache need a Doubly Linked List rather than a Singly Linked List?',
        hint: 'Removing a node in O(1) requires access to its previous pointer without traversing from the head.',
      },
    ],
    checkpointQuestions: [
      {
        question: 'Which pair of data structures enables an LRU Cache to execute get() and put() in guaranteed O(1) time?',
        options: [
          'Binary Search Tree + Array',
          'Hash Map + Doubly Linked List',
          'Singly Linked List + Min Heap',
          'Stack + Queue',
        ],
        correct: 1,
        explanation: 'Hash Map gives O(1) key-to-node lookup; Doubly Linked List gives O(1) deletion and insertion at the head.',
      },
    ],
  },

  // --- DATABASE & SQL ---
  {
    id: 'db-sql-joins',
    topicName: 'SQL Joins, Indexing & ACID Transactions',
    domain: 'engineering',
    category: 'Database Management',
    misconception:
      'Students frequently confuse LEFT JOIN with INNER JOIN when NULL values exist, or fail to understand why B-Tree indexes improve query lookups but penalize INSERT/UPDATE throughput.',
    conceptSummary: [
      'INNER JOIN returns only rows that have matching keys in both tables.',
      'LEFT JOIN returns all rows from the left table, plus matched rows from the right table (NULL filled if no match).',
      'FULL OUTER JOIN returns all rows when there is a match in either left or right table, filling missing fields with NULL.',
      'B-Tree indexes reduce table scan O(n) to O(log n) lookups on indexed columns, but slow down write operations.',
    ],
    keyFormulasOrRules: [
      'ACID: Atomicity (all or nothing), Consistency (valid constraints), Isolation (independent concurrency), Durability (persisted on disk via WAL).',
      'Row count(Full Outer Join) >= Row count(Left Join) and Row count(Right Join).',
    ],
    prerequisites: ['Relational Model', 'Primary & Foreign Keys', 'SQL Syntax'],
    resources: [
      {
        title: 'PostgreSQL Official Documentation: Joins & Indexes',
        source: 'PostgreSQL Official Documentation',
        provider: 'The PostgreSQL Global Development Group',
        type: 'documentation',
        duration: '20 min',
        estimatedMinutes: 20,
        level: 'Intermediate',
        url: 'https://www.postgresql.org/docs/current/queries-table-expressions.html',
        whyRecommended: 'Official primary reference documenting join algorithms (Nested Loop, Hash Join, Merge Join).',
        concept: 'Relational Database',
        subtopic: 'Join Semantics & Query Planner',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'official_doc',
        prerequisites: ['SQL Basics'],
        completionCriteria: 'Explain the difference between Hash Join and Nested Loop Join.',
      },
      {
        title: 'SQL Joins Visualized with Venn Diagrams and Real Edge Cases',
        source: 'GateSmashers',
        provider: 'GateSmashers DBMS Series',
        type: 'video',
        duration: '15 min',
        estimatedMinutes: 15,
        level: 'Beginner',
        url: 'https://www.youtube.com/@GateSmashers',
        whyRecommended: 'Clear step-by-step table examples highlighting NULL row behavior in outer joins.',
        concept: 'SQL Querying',
        subtopic: 'INNER vs LEFT vs FULL Joins',
        language: 'Bilingual',
        lastVerified: '2025-01',
        sourceType: 'verified_educator',
        prerequisites: ['SQL SELECT'],
        completionCriteria: 'Write queries with LEFT JOIN handling missing relationships.',
      },
    ],
    practiceDrills: [
      {
        prompt: 'Write an SQL query to find employees whose salary is greater than their department average.',
        hint: 'Use a subquery or Window function: AVG(salary) OVER(PARTITION BY department_id).',
      },
    ],
    checkpointQuestions: [
      {
        question: 'Which ACID property guarantees that once a transaction completes successfully, changes are permanently saved even if a power failure occurs immediately after?',
        options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
        correct: 3,
        explanation: 'Durability guarantees that committed transactions survive crashes and power loss via Write-Ahead Logging (WAL).',
      },
      {
        question: 'Table A has 5 rows and Table B has 0 rows. How many rows will "SELECT * FROM A LEFT JOIN B ON A.id = B.id" return?',
        options: ['0 rows', '5 rows', '10 rows', 'Error'],
        correct: 1,
        explanation: 'LEFT JOIN returns all rows from the left table regardless of matches, with NULL for all columns from Table B.',
      },
    ],
  },

  // --- NETWORKING & SYSTEM DESIGN ---
  {
    id: 'networking-sysdesign-protocols',
    topicName: 'HTTP/HTTPS, TLS Encryption & Distributed Systems',
    domain: 'engineering',
    category: 'Computer Networks & Systems',
    misconception:
      'Students believe HTTPS uses symmetric encryption for the entire connection without realizing the initial asymmetric handshake (TLS) is used to exchange symmetric session keys.',
    conceptSummary: [
      'HTTPS uses TLS. Asymmetric cryptography (Public/Private key pair) is used during the handshake to verify server identity and securely agree on a session key.',
      'Once established, fast Symmetric encryption (e.g., AES-GCM) encrypts payload data for high throughput.',
      'TCP uses a 3-way handshake (SYN, SYN-ACK, ACK) to establish reliable byte-stream transmission with sequence numbers.',
      'Eventual Consistency in distributed systems means replicas may temporarily diverge under network partitions (CAP theorem), but converge once updates cease.',
    ],
    keyFormulasOrRules: [
      'CAP Theorem: A distributed data store can guarantee at most two of Consistency, Availability, and Partition Tolerance.',
      'TLS Handshake: ClientHello -> ServerHello + Certificate -> Key Exchange -> Finished -> Encrypted Traffic.',
    ],
    prerequisites: ['OSI 7-Layer Model', 'TCP/IP', 'Client-Server Architecture'],
    resources: [
      {
        title: 'System Design Primer — Scalability & Distributed Systems',
        source: 'GitHub / Donne Martin',
        provider: 'Open Source System Design Primer',
        type: 'documentation',
        duration: '35 min',
        estimatedMinutes: 35,
        level: 'Intermediate',
        url: 'https://github.com/donnemartin/system-design-primer',
        whyRecommended: 'The universally recommended curriculum for product company technical screening rounds.',
        concept: 'Distributed Systems',
        subtopic: 'CAP Theorem, Caching & Load Balancing',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'industry_standard',
        prerequisites: ['Networks', 'Databases'],
        completionCriteria: 'Explain trade-offs between CP and AP distributed architectures.',
      },
      {
        title: 'MDN Web Docs: An Overview of HTTP and HTTPS',
        source: 'MDN Web Docs',
        provider: 'Mozilla Developer Network',
        type: 'documentation',
        duration: '18 min',
        estimatedMinutes: 18,
        level: 'Beginner',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
        whyRecommended: 'The authoritative web standard documentation covering request/response headers, status codes, and security.',
        concept: 'Application Protocols',
        subtopic: 'HTTP Methods, Headers & TLS',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'official_doc',
        prerequisites: ['Client-Server Model'],
        completionCriteria: 'Explain how HTTP/2 multiplexing differs from HTTP/1.1 pipelining.',
      },
    ],
    practiceDrills: [
      {
        prompt: 'What happens when you type https://google.com into your browser and press Enter?',
        hint: 'DNS resolution -> TCP 3-way handshake -> TLS negotiation -> HTTP GET request -> Server processing -> Response render.',
      },
    ],
    checkpointQuestions: [
      {
        question: 'What is the exact packet sequence exchanged to establish a standard TCP connection?',
        options: [
          'SYN → ACK → SYN-ACK',
          'SYN → SYN-ACK → ACK',
          'ACK → SYN → ACK-SYN',
          'PING → PONG → ACK',
        ],
        correct: 1,
        explanation: 'Client sends SYN, server responds with SYN-ACK, client completes handshake with ACK.',
      },
    ],
  },

  // --- QUANTITATIVE APTITUDE ---
  {
    id: 'aptitude-arithmetic',
    topicName: 'Percentages, Profit & Loss, Simple & Compound Interest',
    domain: 'commerce',
    category: 'Quantitative Aptitude',
    misconception:
      'Students calculate Profit % on Selling Price instead of Cost Price, or fail to use fractional shortcuts for percentages (e.g., 25% = 1/4, 16.66% = 1/6).',
    conceptSummary: [
      'Profit % is always calculated relative to Cost Price (CP) unless explicitly specified otherwise: Profit % = (SP - CP) / CP × 100.',
      'Simple Interest accrues linearly: SI = (P × R × T) / 100.',
      'Compound Interest accrues on accumulated interest: Amount = P(1 + R/100)ᵀ. The difference for 2 years is P(R/100)². ',
      'Use successive percentage formula for successive discounts/changes: A + B + (A × B)/100.',
    ],
    keyFormulasOrRules: [
      'Profit % = (Gain / Cost Price) × 100',
      'CI - SI for 2 years = P × (R / 100)²',
      'Ratio combining: if A:B = 2:3 and B:C = 4:5, common B=12 => A:B:C = 8:12:15',
    ],
    prerequisites: ['Basic Arithmetic', 'Fractions & Decimals'],
    resources: [
      {
        title: 'Quantitative Aptitude Shortcuts for Placements (TCS NQT, Infosys, SBI)',
        source: 'IndiaBIX',
        provider: 'IndiaBIX Educational Testing',
        type: 'interactive',
        duration: '20 min',
        estimatedMinutes: 20,
        level: 'Beginner',
        url: 'https://www.indiabix.com/aptitude/questions-and-answers/',
        whyRecommended: 'Direct question patterns tested in Indian campus placement exams and banking tests.',
        concept: 'Percentages & Arithmetic',
        subtopic: 'Profit, Loss & Interest',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'industry_standard',
        prerequisites: ['Arithmetic'],
        completionCriteria: 'Solve 10 timed questions in under 12 minutes.',
      },
      {
        title: 'Khan Academy: Compound Interest and Percentage Multipliers',
        source: 'Khan Academy',
        provider: 'Khan Academy Financial Literacy',
        type: 'video',
        duration: '15 min',
        estimatedMinutes: 15,
        level: 'Beginner',
        url: 'https://www.khanacademy.org',
        whyRecommended: 'Intuitive visual explanation of exponential growth and compounding intervals.',
        concept: 'Interest',
        subtopic: 'Compounding Periods',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'institution',
        prerequisites: ['Fractions'],
        completionCriteria: 'Calculate quarterly and annual compounding differences.',
      },
    ],
    practiceDrills: [
      {
        prompt: 'If the price of petrol increases by 25%, by what percentage must consumption be reduced so expenditure remains constant?',
        hint: 'Use formula: (R / (100 + R)) × 100 = (25 / 125) × 100 = 20%.',
      },
    ],
    checkpointQuestions: [
      {
        question: 'An item is purchased for ₹400 and sold for ₹500. What is the profit percentage?',
        options: ['20%', '25%', '30%', '15%'],
        correct: 1,
        explanation: 'Profit = ₹500 - ₹400 = ₹100. Profit % = (100 / 400) × 100 = 25%.',
      },
    ],
  },

  // --- COMMERCE & BANKING AWARENESS ---
  {
    id: 'commerce-banking-awareness',
    topicName: 'Indian Banking System, Regulatory Bodies & Monetary Policy',
    domain: 'commerce',
    category: 'Banking & Financial Awareness',
    misconception:
      'Students confuse NABARD (agricultural refinance) with commercial banks, or mix up NEFT (batch, no minimum) with RTGS (real-time gross, ₹2 lakh minimum).',
    conceptSummary: [
      'NABARD (National Bank for Agriculture and Rural Development) is the apex development financial institution set up under the NABARD Act 1981.',
      'KYC (Know Your Customer) is mandated by RBI under the Prevention of Money Laundering Act to verify customer identity and address.',
      'RTGS (Real Time Gross Settlement) has a minimum transaction limit of ₹2,00,000 for high-value immediate fund transfers.',
      'An asset becomes a Non-Performing Asset (NPA) when interest or principal remains overdue for more than 90 days.',
    ],
    keyFormulasOrRules: [
      'RTGS: Min ₹2 Lakh, No Upper limit (24x7x365)',
      'NEFT: No minimum, No maximum, settlement in half-hourly batches',
      'NPA threshold: 90 days overdue for commercial loans',
    ],
    prerequisites: ['Basics of Indian Economy', 'RBI Monetary Roles'],
    resources: [
      {
        title: 'Reserve Bank of India: Official Functions & Monetary Policy',
        source: 'Reserve Bank of India (RBI)',
        provider: 'RBI Official Portal',
        type: 'documentation',
        duration: '22 min',
        estimatedMinutes: 22,
        level: 'Intermediate',
        url: 'https://www.rbi.org.in',
        whyRecommended: 'Official regulatory documentation defining Repo Rate, Cash Reserve Ratio (CRR), and statutory frameworks.',
        concept: 'Monetary Policy',
        subtopic: 'RBI Policy Rates & Liquidity Tools',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'official_doc',
        prerequisites: ['Banking Basics'],
        completionCriteria: 'Explain how RBI repo rate hike cools inflationary pressure.',
      },
    ],
    practiceDrills: [
      {
        prompt: 'What is the key operational difference between Repo Rate and Reverse Repo Rate?',
        hint: 'Repo is the rate at which RBI lends funds to commercial banks; Reverse Repo is where RBI absorbs liquidity from banks.',
      },
    ],
    checkpointQuestions: [
      {
        question: 'What is the minimum transaction amount required for transfer via RTGS in India?',
        options: ['₹50,000', '₹1,00,000', '₹2,00,000', 'No minimum'],
        correct: 2,
        explanation: 'RTGS is intended for high-value transactions with a mandatory minimum limit of ₹2 Lakh.',
      },
      {
        question: 'When is a commercial loan classified as a Non-Performing Asset (NPA) under standard RBI guidelines?',
        options: [
          'When overdue for more than 30 days',
          'When overdue for more than 60 days',
          'When overdue for more than 90 days',
          'When overdue for more than 180 days',
        ],
        correct: 2,
        explanation: 'Under RBI prudential norms, an asset is classified as NPA when interest or principal remains overdue for more than 90 days.',
      },
    ],
  },

  // --- ARTS & INDIAN POLITY ---
  {
    id: 'arts-indian-polity',
    topicName: 'Indian Constitution, Fundamental Rights & Amendments',
    domain: 'arts',
    category: 'Indian Polity & Governance',
    misconception:
      'Students confuse the 42nd Amendment (Mini-Constitution, added Socialist/Secular) with the 44th Amendment (restored fundamental freedoms after Emergency), or miss the Basic Structure origin.',
    conceptSummary: [
      'The Indian Constitution originally had 8 schedules, expanded to 12 schedules through constitutional amendments.',
      'Article 21 guarantees the Right to Life and Personal Liberty; broadly interpreted in Maneka Gandhi (1978) to require just, fair, and reasonable procedures.',
      'The "Basic Structure Doctrine" was established in Kesavananda Bharati v. State of Kerala (1973), ruling Parliament cannot alter the basic framework of the Constitution.',
      'The 42nd Constitutional Amendment Act of 1976 is called the "Mini-Constitution" due to its sweeping structural revisions.',
    ],
    keyFormulasOrRules: [
      '73rd Amendment (1992): Panchayati Raj institutions (Part IX, 11th Schedule)',
      '74th Amendment (1992): Urban Local Bodies (Municipalities, 12th Schedule)',
      '42nd Amendment (1976): Added Socialist, Secular, Integrity to Preamble',
    ],
    prerequisites: ['Preamble of Indian Constitution', 'Three Organs of State'],
    resources: [
      {
        title: 'National Portal of India — Constitution & Statutory Framework',
        source: 'Legislative Department, Ministry of Law and Justice',
        provider: 'Government of India Official Legal Portal',
        type: 'documentation',
        duration: '25 min',
        estimatedMinutes: 25,
        level: 'Intermediate',
        url: 'https://legislative.gov.in/constitution-of-india/',
        whyRecommended: 'Official primary text of the Constitution of India with verified amendment history.',
        concept: 'Constitutional Law',
        subtopic: 'Fundamental Rights & Judicial Review',
        language: 'English',
        lastVerified: '2025-01',
        sourceType: 'official_doc',
        prerequisites: ['Indian Polity Basics'],
        completionCriteria: 'Cite key Supreme Court rulings defining fundamental rights expansion.',
      },
    ],
    practiceDrills: [
      {
        prompt: 'Explain how the Kesavananda Bharati case constrained parliamentary sovereignty in India.',
        hint: 'Article 368 gives amending power, but not destruction of core features like judicial review, secularism, or federalism.',
      },
    ],
    checkpointQuestions: [
      {
        question: 'Which landmark Supreme Court judgment established the Basic Structure Doctrine in Indian Constitutional Law?',
        options: [
          'Golaknath v. State of Punjab (1967)',
          'Kesavananda Bharati v. State of Kerala (1973)',
          'Minerva Mills v. Union of India (1980)',
          'Maneka Gandhi v. Union of India (1978)',
        ],
        correct: 1,
        explanation: 'The 13-judge bench in Kesavananda Bharati (1973) held that Parliament cannot alter the Basic Structure of the Constitution.',
      },
      {
        question: 'How many schedules are currently present in the Constitution of India?',
        options: ['8', '10', '12', '14'],
        correct: 2,
        explanation: 'Originally 8 schedules were present; subsequent amendments expanded the count to 12 schedules.',
      },
    ],
  },
];

/**
 * Matches a quiz topic or missed question to curated curriculum items
 */
export function findCurriculumForTopic(topic: string, questionText?: string): LearningCurriculumItem {
  const normalized = topic.toLowerCase();
  const qNorm = (questionText || '').toLowerCase();

  // Arrays & Two Pointers
  if (
    normalized.includes('two pointer') ||
    normalized.includes('sliding window') ||
    qNorm.includes('subarray') ||
    qNorm.includes('sliding window') ||
    qNorm.includes('two pointer') ||
    qNorm.includes('prefix sum')
  ) {
    const item = LEARNING_CURRICULUM.find(c => c.id === 'dsa-arrays-two-pointers');
    if (item) return item;
  }

  // Graph / LRU
  if (normalized.includes('graph') || qNorm.includes('cycle') || qNorm.includes('lru') || qNorm.includes('amortized')) {
    const item = LEARNING_CURRICULUM.find(c => c.id === 'dsa-graphs-cache');
    if (item) return item;
  }

  // Sorting / Trees
  if (normalized.includes('tree') || normalized.includes('sort') || qNorm.includes('tree') || qNorm.includes('sort')) {
    const item = LEARNING_CURRICULUM.find(c => c.id === 'dsa-sorting-trees');
    if (item) return item;
  }

  // DSA general / Binary Search
  if (
    normalized.includes('dsa') ||
    normalized.includes('algorithm') ||
    qNorm.includes('binary search') ||
    qNorm.includes('complexity') ||
    qNorm.includes('log n')
  ) {
    const item = LEARNING_CURRICULUM.find(c => c.id === 'dsa-binary-search-complexity');
    if (item) return item;
  }

  // Database
  if (normalized.includes('database') || normalized.includes('sql') || qNorm.includes('join') || qNorm.includes('table') || qNorm.includes('acid') || qNorm.includes('durability')) {
    const item = LEARNING_CURRICULUM.find(c => c.id === 'db-sql-joins');
    if (item) return item;
  }

  // Networking & System Design
  if (
    normalized.includes('network') ||
    normalized.includes('system') ||
    qNorm.includes('https') ||
    /\brest\b/i.test(qNorm) ||
    qNorm.includes('docker') ||
    qNorm.includes('protocol') ||
    qNorm.includes('tcp')
  ) {
    const item = LEARNING_CURRICULUM.find(c => c.id === 'networking-sysdesign-protocols');
    if (item) return item;
  }

  // Aptitude / Quant
  if (
    normalized.includes('aptitude') ||
    normalized.includes('quant') ||
    qNorm.includes('profit') ||
    qNorm.includes('interest') ||
    qNorm.includes('average') ||
    qNorm.includes('percentage')
  ) {
    const item = LEARNING_CURRICULUM.find(c => c.id === 'aptitude-arithmetic');
    if (item) return item;
  }

  // Banking
  if (normalized.includes('banking') || qNorm.includes('nabard') || qNorm.includes('kyc') || qNorm.includes('npa') || qNorm.includes('rtgs')) {
    const item = LEARNING_CURRICULUM.find(c => c.id === 'commerce-banking-awareness');
    if (item) return item;
  }

  // Polity & UPSC
  if (
    normalized.includes('polity') ||
    normalized.includes('upsc') ||
    qNorm.includes('constitution') ||
    qNorm.includes('article') ||
    qNorm.includes('amendment') ||
    qNorm.includes('schedule')
  ) {
    const item = LEARNING_CURRICULUM.find(c => c.id === 'arts-indian-polity');
    if (item) return item;
  }

  // Default fallback
  return LEARNING_CURRICULUM[0];
}
