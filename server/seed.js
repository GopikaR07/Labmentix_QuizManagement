/**
 * server/seed.js
 *
 * DEVELOPMENT-ONLY seed script for the Quiz Management & Online Assessment Platform.
 *
 * This script does NOT touch application code, routes, controllers, models,
 * schema, or auth logic. It only inserts/refreshes demo data through the
 * existing PostgreSQL connection pool (config/database.js), using exactly
 * the tables/columns defined in db/schema.sql:
 *
 *   users, categories, quizzes, questions, options, attempts, answers
 *
 * Safe to run multiple times:
 *   - categories are matched by their UNIQUE name and reused if present
 *   - quizzes are matched by exact title and reused if present (questions/
 *     options are only inserted the first time a quiz is created)
 *   - students are matched by their UNIQUE email and reused if present
 *   - attempts/answers for the seeded students+quizzes are deleted and
 *     recreated fresh on every run, so re-running never piles up duplicate
 *     attempts. Real users, real quizzes, and any attempts that don't
 *     belong to a seeded (student, quiz) pair are never touched.
 *
 * Run from the server/ directory:
 *   node seed.js
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("./config/database");

// Same cost factor authController.js uses for bcrypt.hash(password, 10)
const SALT_ROUNDS = 10;
const STUDENT_PASSWORD = "Student@123";

// ---------------------------------------------------------------------------
// DEMO DATA
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { name: "Operating Systems", description: "Processes, threads, scheduling, memory management, and synchronization." },
  { name: "DBMS", description: "Relational database concepts, SQL, normalization, transactions, and indexing." },
  { name: "OOPS", description: "Object-oriented programming principles and concepts." },
  { name: "Computer Networks", description: "Networking fundamentals, protocols, and the OSI/TCP-IP models." },
  { name: "DSA", description: "Data structures, algorithms, and time complexity." },
];

// Each quiz: category name (must match CATEGORIES), title, description,
// difficulty, duration (minutes), passing_score (%), max_attempts, status,
// and exactly 5 questions, each with 4 options where correct is the index
// (0-3) of the correct option.
const QUIZZES = [
  // ---------------- Operating Systems ----------------
  {
    category: "Operating Systems",
    title: "OS Fundamentals & Process Management",
    description: "Covers processes, threads, and CPU scheduling basics.",
    difficulty: "BEGINNER",
    duration: 20,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "What best describes a process in an operating system?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "A process is a program in execution, including its current activity such as the program counter and register values.",
        options: ["A program in execution", "A file stored on the disk", "A piece of computer hardware", "A type of network protocol"],
        correct: 0,
      },
      {
        text: "What is a thread?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "A thread is the smallest unit of CPU scheduling within a process; multiple threads in a process share the same address space.",
        options: ["The smallest unit of CPU execution within a process", "An independent program with its own address space", "A physical CPU core", "A scheduling algorithm"],
        correct: 0,
      },
      {
        text: "Which scheduling algorithm assigns each process a fixed time slice and cycles through the ready queue?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "Round Robin scheduling gives each process a fixed time quantum and cycles through the ready queue, making it well suited for time-sharing systems.",
        options: ["Round Robin", "Shortest Job First", "Priority Scheduling", "First Come First Served"],
        correct: 0,
      },
      {
        text: "What is the key difference between a process and a thread?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "Threads belonging to the same process share code, data, and memory space, whereas each process has its own isolated address space.",
        options: [
          "Threads within a process share the same address space, while separate processes have their own address spaces",
          "Processes share memory with each other by default",
          "Threads and processes are exactly the same thing",
          "Threads always execute on a different CPU than their parent process",
        ],
        correct: 0,
      },
      {
        text: "Which of the following is typically NOT one of the standard process states?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "The typical process states are New, Ready, Running, Waiting, and Terminated. 'Compiled' is a compilation stage, not a runtime process state.",
        options: ["Compiled", "Ready", "Running", "Waiting"],
        correct: 0,
      },
    ],
  },
  {
    category: "Operating Systems",
    title: "Memory Management & Synchronization",
    description: "Covers deadlocks, virtual memory, paging, and synchronization primitives.",
    difficulty: "INTERMEDIATE",
    duration: 25,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "What is a deadlock?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "A deadlock occurs when a set of processes are each waiting for a resource held by another process in the set, so none can proceed.",
        options: [
          "A situation where two or more processes are blocked forever, each waiting for a resource held by the other",
          "A process that has finished execution",
          "A scheduling technique for prioritizing I/O tasks",
          "A method of allocating extra CPU time to a process",
        ],
        correct: 0,
      },
      {
        text: "Which of the following is NOT one of the four necessary conditions for deadlock?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "The four necessary conditions for deadlock are Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait — preemption itself is the opposite of one of these conditions.",
        options: ["Preemption", "Mutual Exclusion", "Hold and Wait", "Circular Wait"],
        correct: 0,
      },
      {
        text: "What is virtual memory primarily used for?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "Virtual memory gives each process the illusion of a large, contiguous address space by mapping virtual addresses to physical RAM or disk (swap space) as needed.",
        options: [
          "To let a process use more memory than is physically available by mapping addresses to disk and RAM",
          "To permanently store files on the hard disk",
          "To speed up the CPU clock",
          "To directly connect two processes for communication",
        ],
        correct: 0,
      },
      {
        text: "In paging, what is a 'page fault'?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "A page fault occurs when a process references a page that is not currently mapped into physical memory, prompting the OS to load it from disk.",
        options: [
          "An event that occurs when a program accesses a page that is not currently loaded in physical memory",
          "A hardware failure in the RAM chip",
          "An error in the CPU's arithmetic unit",
          "A syntax error in the operating system code",
        ],
        correct: 0,
      },
      {
        text: "Which synchronization primitive allows only one thread to enter a critical section at a time by using a binary lock?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "A mutex (mutual exclusion lock) allows only one thread to hold the lock and enter the critical section at a time, preventing race conditions.",
        options: ["Mutex", "Scheduler", "Page Table", "Interrupt Vector"],
        correct: 0,
      },
    ],
  },

  // ---------------- DBMS ----------------
  {
    category: "DBMS",
    title: "Database Fundamentals & SQL Basics",
    description: "Covers keys, constraints, and basic SQL querying.",
    difficulty: "BEGINNER",
    duration: 20,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "What is a primary key in a relational database table?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "A primary key uniquely identifies each row in a table and cannot contain NULL or duplicate values.",
        options: [
          "A column (or set of columns) that uniquely identifies each row in a table",
          "Any column that contains numeric data",
          "A key used only for foreign tables",
          "A column that must always contain NULL values",
        ],
        correct: 0,
      },
      {
        text: "What is a foreign key used for?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "A foreign key is a column that references the primary key of another table, enforcing referential integrity between the two tables.",
        options: [
          "To create a link between two tables by referencing the primary key of another table",
          "To encrypt sensitive data in a table",
          "To automatically delete duplicate rows",
          "To speed up the CPU processing SQL queries",
        ],
        correct: 0,
      },
      {
        text: "Which SQL clause is used to filter individual rows before any grouping happens?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "WHERE filters individual rows before any grouping occurs, while HAVING filters groups after aggregation.",
        options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
        correct: 0,
      },
      {
        text: "Which type of SQL join returns only the rows that have matching values in both tables?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "An INNER JOIN returns only the rows where there is a match in both joined tables.",
        options: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN"],
        correct: 0,
      },
      {
        text: "What does the NOT NULL constraint enforce on a column?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "A NOT NULL constraint ensures that a column always contains a value and cannot be left empty.",
        options: [
          "The column cannot store a NULL (empty) value",
          "The column must store only numbers",
          "The column values must all be unique",
          "The column can be updated only once",
        ],
        correct: 0,
      },
    ],
  },
  {
    category: "DBMS",
    title: "Normalization, Transactions & Indexing",
    description: "Covers normal forms, ACID properties, and indexes.",
    difficulty: "INTERMEDIATE",
    duration: 25,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "What is the main goal of database normalization?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "Normalization organizes data to minimize redundancy and dependency, improving consistency and integrity.",
        options: [
          "To reduce data redundancy and improve data integrity by organizing data into related tables",
          "To make queries run without using SQL",
          "To store all data in a single large table",
          "To increase the physical size of the database",
        ],
        correct: 0,
      },
      {
        text: "A table is in Second Normal Form (2NF) when it is in 1NF and additionally:",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "2NF requires the table to be in 1NF and have no partial dependency, meaning non-key attributes depend on the whole primary key, not just part of it.",
        options: [
          "Has no partial dependency of any column on part of a composite primary key",
          "Contains no foreign keys at all",
          "Has exactly one column",
          "Stores data in alphabetical order",
        ],
        correct: 0,
      },
      {
        text: "What does the 'A' in the ACID properties of a transaction stand for?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "Atomicity means a transaction is treated as a single indivisible unit that either fully completes or has no effect at all.",
        options: ["Atomicity", "Availability", "Authentication", "Aggregation"],
        correct: 0,
      },
      {
        text: "What is the primary purpose of a database index?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "An index creates a data structure that allows the database engine to find rows faster, similar to an index in a book, though it adds overhead on writes.",
        options: [
          "To speed up data retrieval operations on a table at the cost of some extra storage and write overhead",
          "To permanently delete unused rows",
          "To enforce that a column only stores text data",
          "To automatically translate SQL into another language",
        ],
        correct: 0,
      },
      {
        text: "What does the Isolation property in ACID guarantee?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "Isolation ensures that concurrently executing transactions produce results as if they had been executed sequentially, preventing interference.",
        options: [
          "Concurrent transactions execute as if they were run one after another, without interfering with each other",
          "All transactions must run on isolated servers",
          "Data is isolated permanently from all users",
          "Transactions cannot access any table twice",
        ],
        correct: 0,
      },
    ],
  },

  // ---------------- OOPS ----------------
  {
    category: "OOPS",
    title: "OOP Fundamentals",
    description: "Covers classes, objects, inheritance, encapsulation, and abstraction.",
    difficulty: "BEGINNER",
    duration: 20,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "What is a class in object-oriented programming?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "A class defines the structure (attributes) and behavior (methods) that its objects will have; it is a blueprint, not an object itself.",
        options: [
          "A blueprint or template used to create objects with shared properties and behavior",
          "A single instance of a running program",
          "A type of loop used for iteration",
          "A built-in database table",
        ],
        correct: 0,
      },
      {
        text: "What is an object in OOP?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "An object is a concrete instance created from a class, holding its own data (state) and able to invoke the class's methods.",
        options: [
          "An instance of a class that has its own state and behavior",
          "A function defined outside of any class",
          "A variable that stores only integers",
          "A reserved keyword in most languages",
        ],
        correct: 0,
      },
      {
        text: "What does inheritance allow a class to do?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "Inheritance lets a subclass reuse and extend the fields and methods of a parent class, supporting code reuse and hierarchy.",
        options: [
          "Acquire the properties and behavior of another (parent/base) class",
          "Delete methods from unrelated classes",
          "Run multiple programs simultaneously",
          "Convert itself into a primitive data type",
        ],
        correct: 0,
      },
      {
        text: "What is encapsulation in OOP?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "Encapsulation bundles an object's data with its methods and hides internal implementation details behind access modifiers like private/public.",
        options: [
          "Bundling data and the methods that operate on it together while restricting direct access to internal details",
          "Splitting a class into many unrelated files",
          "Running two classes in parallel threads",
          "Converting private methods into global functions",
        ],
        correct: 0,
      },
      {
        text: "What is abstraction in OOP primarily concerned with?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "Abstraction focuses on exposing only relevant, essential features of an object while hiding the underlying complexity of implementation.",
        options: [
          "Hiding complex implementation details and exposing only the essential features to the user",
          "Making all class members public",
          "Increasing the number of lines of code",
          "Removing all comments from the source code",
        ],
        correct: 0,
      },
    ],
  },
  {
    category: "OOPS",
    title: "Polymorphism, Constructors & Interfaces",
    description: "Covers polymorphism, constructors, overloading/overriding, and interfaces.",
    difficulty: "INTERMEDIATE",
    duration: 25,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "What is polymorphism in object-oriented programming?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "Polymorphism allows the same interface (e.g., a method name) to behave differently depending on the object or the data types involved.",
        options: [
          "The ability of an object or method to take on many forms, such as behaving differently based on the calling object",
          "The ability to run a program on multiple operating systems",
          "A rule that forbids a class from having more than one method",
          "The process of converting an object into a string",
        ],
        correct: 0,
      },
      {
        text: "What is a constructor in OOP?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "A constructor is a special method invoked automatically when an object is created, typically used to initialize its instance variables.",
        options: [
          "A special method automatically called to initialize a newly created object",
          "A method used only to destroy objects",
          "A variable declared inside a loop",
          "A type of database index",
        ],
        correct: 0,
      },
      {
        text: "What distinguishes method overloading from method overriding?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "Overloading is compile-time polymorphism within one class using different parameter lists, while overriding is runtime polymorphism where a subclass provides its own implementation of a parent method.",
        options: [
          "Overloading defines multiple methods with the same name but different parameters in the same class, while overriding redefines a parent method in a subclass with the same signature",
          "Overloading and overriding are exactly the same concept",
          "Overriding only works with static methods",
          "Overloading can only occur across different classes, never within one class",
        ],
        correct: 0,
      },
      {
        text: "What is an interface in OOP typically used for?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "An interface declares method signatures that implementing classes must define, enforcing a contract without dictating the implementation.",
        options: [
          "To define a contract of methods that implementing classes must provide, without specifying how they work",
          "To store the compiled bytecode of a program",
          "To physically connect two computers over a network",
          "To replace all constructors in a class",
        ],
        correct: 0,
      },
      {
        text: "Which OOP concept allows a subclass to provide its own specific implementation of a method already defined in its parent class?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "Method overriding lets a subclass redefine a method inherited from its parent class, using the same name and parameters, to provide specialized behavior.",
        options: ["Method overriding", "Method overloading", "Encapsulation", "Abstraction"],
        correct: 0,
      },
    ],
  },

  // ---------------- Computer Networks ----------------
  {
    category: "Computer Networks",
    title: "Networking Basics: OSI & TCP/IP",
    description: "Covers the OSI model, TCP/IP model, IP addresses, and MAC addresses.",
    difficulty: "BEGINNER",
    duration: 20,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "How many layers does the OSI reference model have?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "The OSI model consists of seven layers: Physical, Data Link, Network, Transport, Session, Presentation, and Application.",
        options: ["7", "4", "5", "9"],
        correct: 0,
      },
      {
        text: "Which OSI layer is responsible for logical addressing and routing of packets?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "The Network layer (Layer 3) handles logical addressing (like IP addresses) and determines the path packets take through routing.",
        options: ["Network layer", "Physical layer", "Presentation layer", "Session layer"],
        correct: 0,
      },
      {
        text: "How many layers does the TCP/IP model typically have, as commonly taught?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "The TCP/IP model is commonly described with four layers: Network Interface, Internet, Transport, and Application.",
        options: ["4", "7", "2", "6"],
        correct: 0,
      },
      {
        text: "What is the primary purpose of an IP address?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "An IP address uniquely identifies a device on a network so that data packets can be routed to the correct destination.",
        options: [
          "To uniquely identify a device on a network for routing data to it",
          "To encrypt data sent over the internet",
          "To store the device's manufacturer name",
          "To measure the speed of a network connection",
        ],
        correct: 0,
      },
      {
        text: "What is a MAC address primarily used to identify?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "A MAC (Media Access Control) address is a hardware address burned into a network interface card, used for communication within a local network segment.",
        options: [
          "A network interface card at the hardware (Data Link) level",
          "A user's email account",
          "A website's domain name",
          "A database table's primary key",
        ],
        correct: 0,
      },
    ],
  },
  {
    category: "Computer Networks",
    title: "Protocols, Routing & DNS",
    description: "Covers TCP vs UDP, DNS, HTTP/HTTPS, routing, and common protocols.",
    difficulty: "INTERMEDIATE",
    duration: 25,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "What is a key difference between TCP and UDP?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "TCP establishes a connection and guarantees reliable, ordered delivery, while UDP sends packets without a connection or delivery guarantees, making it faster but less reliable.",
        options: [
          "TCP is connection-oriented and reliable, while UDP is connectionless and does not guarantee delivery",
          "TCP is slower and never used on the internet",
          "UDP always encrypts data while TCP does not",
          "TCP and UDP are identical in functionality",
        ],
        correct: 0,
      },
      {
        text: "What does DNS (Domain Name System) primarily do?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "DNS resolves human-friendly domain names, like example.com, into the numeric IP addresses computers use to locate each other.",
        options: [
          "Translates human-readable domain names into IP addresses",
          "Encrypts web traffic between a browser and server",
          "Assigns MAC addresses to network devices",
          "Compresses files before they are transmitted",
        ],
        correct: 0,
      },
      {
        text: "What is the main difference between HTTP and HTTPS?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "HTTPS is HTTP layered over TLS/SSL encryption, protecting data in transit, whereas plain HTTP sends data unencrypted.",
        options: [
          "HTTPS encrypts the communication between client and server using TLS/SSL, while HTTP does not",
          "HTTP is only used for downloading images",
          "HTTPS cannot be used to load websites",
          "HTTP and HTTPS use completely different addressing systems",
        ],
        correct: 0,
      },
      {
        text: "What is the main function of a router in a network?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "A router forwards packets between different networks by examining destination IP addresses and selecting the best path.",
        options: [
          "To forward data packets between different networks based on their destination IP address",
          "To assign hostnames to files",
          "To physically store web pages",
          "To convert analog signals into sound",
        ],
        correct: 0,
      },
      {
        text: "Which of the following is an application-layer protocol used to transfer files between a client and server?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "FTP (File Transfer Protocol) is an application-layer protocol specifically designed for transferring files between a client and a server.",
        options: ["FTP", "IP", "ARP", "MAC"],
        correct: 0,
      },
    ],
  },

  // ---------------- DSA ----------------
  {
    category: "DSA",
    title: "Arrays, Linked Lists & Stacks/Queues",
    description: "Covers arrays, linked lists, stacks, and queues.",
    difficulty: "BEGINNER",
    duration: 25,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "What is the time complexity of accessing an element by index in an array?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "Arrays provide constant-time O(1) access to any element because elements are stored in contiguous memory and can be addressed directly by index.",
        options: ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        correct: 0,
      },
      {
        text: "What is the main advantage of a linked list over an array for insertions in the middle of the structure?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "In a linked list, inserting a node only requires updating neighboring pointers, unlike an array where subsequent elements must be shifted.",
        options: [
          "Insertion doesn't require shifting other elements, only updating a few pointers",
          "Linked lists always use less total memory than arrays",
          "Linked lists provide O(1) random access like arrays",
          "Linked lists cannot grow or shrink in size",
        ],
        correct: 0,
      },
      {
        text: "Which principle does a stack data structure follow?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "A stack follows the LIFO principle, meaning the most recently added element is the first one to be removed.",
        options: ["LIFO (Last In, First Out)", "FIFO (First In, First Out)", "Random access", "Priority based access only"],
        correct: 0,
      },
      {
        text: "Which principle does a queue data structure follow?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "A queue follows the FIFO principle, where elements are removed in the same order they were added.",
        options: ["FIFO (First In, First Out)", "LIFO (Last In, First Out)", "Sorted access only", "No defined order"],
        correct: 0,
      },
      {
        text: "Which operation adds an element to the top of a stack?",
        marks: 1,
        difficulty: "BEGINNER",
        explanation: "Push is the operation used to add an element onto the top of a stack; Pop removes the top element.",
        options: ["Push", "Pop", "Enqueue", "Dequeue"],
        correct: 0,
      },
    ],
  },
  {
    category: "DSA",
    title: "Trees, Graphs, Hashing & Complexity",
    description: "Covers trees, graphs, hashing, sorting, searching, and time complexity.",
    difficulty: "INTERMEDIATE",
    duration: 30,
    passing_score: 60,
    max_attempts: 3,
    status: "PUBLISHED",
    questions: [
      {
        text: "In a binary search tree, where are values smaller than a node's value stored relative to that node?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "In a binary search tree, for every node, all values in its left subtree are smaller and all values in its right subtree are larger.",
        options: ["In the left subtree", "In the right subtree", "At the root only", "They cannot be stored in a BST"],
        correct: 0,
      },
      {
        text: "What is a key difference between a tree and a general graph data structure?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "A tree is a connected, acyclic graph where there is exactly one path between any two nodes; general graphs may contain cycles and multiple paths between nodes.",
        options: [
          "A tree is a special acyclic graph with exactly one path between any two nodes, while general graphs can have cycles and multiple paths",
          "Graphs cannot have edges while trees can",
          "Trees always have more nodes than graphs",
          "A graph must always be a straight line of nodes",
        ],
        correct: 0,
      },
      {
        text: "What is the average-case time complexity of searching for a key in a well-implemented hash table?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "A well-implemented hash table with a good hash function and low collision rate offers average-case O(1) time for search, insert, and delete.",
        options: ["O(1)", "O(n)", "O(n log n)", "O(n^2)"],
        correct: 0,
      },
      {
        text: "Which sorting algorithm has an average and worst-case time complexity of O(n log n)?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "Merge Sort consistently achieves O(n log n) time complexity in both the average and worst cases due to its divide-and-conquer approach.",
        options: ["Merge Sort", "Bubble Sort", "Insertion Sort", "Selection Sort"],
        correct: 0,
      },
      {
        text: "What is the time complexity of binary search on a sorted array of n elements?",
        marks: 1,
        difficulty: "INTERMEDIATE",
        explanation: "Binary search repeatedly halves the search space, giving it a time complexity of O(log n) on a sorted array.",
        options: ["O(log n)", "O(n)", "O(1)", "O(n^2)"],
        correct: 0,
      },
    ],
  },
];

const STUDENTS = [
  { name: "Aarav Sharma", email: "aarav.sharma@example.com" },
  { name: "Diya Patel", email: "diya.patel@example.com" },
  { name: "Rohan Kumar", email: "rohan.kumar@example.com" },
  { name: "Ananya Singh", email: "ananya.singh@example.com" },
  { name: "Vikram Rao", email: "vikram.rao@example.com" },
  { name: "Meera Nair", email: "meera.nair@example.com" },
  { name: "Arjun Mehta", email: "arjun.mehta@example.com" },
  { name: "Sneha Iyer", email: "sneha.iyer@example.com" },
  { name: "Karan Shah", email: "karan.shah@example.com" },
  { name: "Priya Menon", email: "priya.menon@example.com" },
];

const TOTAL_ATTEMPTS_TARGET = 40;
const DAYS_BACK = 14;

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomInt(min, max) {
  // inclusive of min and max
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPastDate(daysBack) {
  const now = Date.now();
  const past = now - randomInt(0, daysBack) * 24 * 60 * 60 * 1000;
  // spread across a realistic hour of the day too
  const withHour = new Date(past);
  withHour.setHours(randomInt(8, 22), randomInt(0, 59), randomInt(0, 59), 0);
  return withHour;
}

// ---------------------------------------------------------------------------
// SEED STEPS
// ---------------------------------------------------------------------------

async function seedCategories(client) {
  const idByName = {};
  for (const cat of CATEGORIES) {
    const existing = await client.query("SELECT id FROM categories WHERE name = $1", [cat.name]);
    if (existing.rows.length > 0) {
      idByName[cat.name] = existing.rows[0].id;
      continue;
    }
    const inserted = await client.query(
      "INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING id",
      [cat.name, cat.description]
    );
    idByName[cat.name] = inserted.rows[0].id;
  }
  return idByName;
}

async function seedQuizzesAndQuestions(client, categoryIdByName, adminUserId) {
  const quizRecords = []; // { id, title, passing_score, duration, questions: [{id, marks, options:[{id,is_correct}]}] }
  let quizzesCreated = 0;
  let questionsCreated = 0;

  for (const q of QUIZZES) {
    const categoryId = categoryIdByName[q.category];
    const existingQuiz = await client.query("SELECT id FROM quizzes WHERE title = $1", [q.title]);

    let quizId;
    let isNewQuiz;

    if (existingQuiz.rows.length > 0) {
      quizId = existingQuiz.rows[0].id;
      isNewQuiz = false;
    } else {
      const insertedQuiz = await client.query(
        `INSERT INTO quizzes
           (title, description, category_id, difficulty, duration, passing_score, max_attempts, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [q.title, q.description, categoryId, q.difficulty, q.duration, q.passing_score, q.max_attempts, q.status, adminUserId]
      );
      quizId = insertedQuiz.rows[0].id;
      isNewQuiz = true;
      quizzesCreated++;
    }

    let questions = [];

    if (isNewQuiz) {
      for (const question of q.questions) {
        const insertedQuestion = await client.query(
          `INSERT INTO questions (quiz_id, question_text, marks, explanation, difficulty)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [quizId, question.text, question.marks, question.explanation, question.difficulty]
        );
        const questionId = insertedQuestion.rows[0].id;
        questionsCreated++;

        const optionRows = [];
        for (let i = 0; i < question.options.length; i++) {
          const isCorrect = i === question.correct;
          const insertedOption = await client.query(
            `INSERT INTO options (question_id, option_text, is_correct)
             VALUES ($1, $2, $3)
             RETURNING id, is_correct`,
            [questionId, question.options[i], isCorrect]
          );
          optionRows.push(insertedOption.rows[0]);
        }

        questions.push({ id: questionId, marks: question.marks, options: optionRows });
      }
    } else {
      // Quiz already existed from a previous run — reuse its existing questions/options as-is.
      const existingQuestions = await client.query(
        "SELECT id, marks FROM questions WHERE quiz_id = $1 ORDER BY id",
        [quizId]
      );
      for (const eq of existingQuestions.rows) {
        const opts = await client.query(
          "SELECT id, is_correct FROM options WHERE question_id = $1 ORDER BY id",
          [eq.id]
        );
        questions.push({ id: eq.id, marks: eq.marks, options: opts.rows });
      }
    }

    quizRecords.push({
      id: quizId,
      title: q.title,
      passing_score: q.passing_score,
      duration: q.duration,
      questions,
    });
  }

  return { quizRecords, quizzesCreated, questionsCreated };
}

async function seedStudents(client) {
  const hashedPassword = await bcrypt.hash(STUDENT_PASSWORD, SALT_ROUNDS);
  const studentIds = [];
  let studentsCreated = 0;

  for (const s of STUDENTS) {
    const existing = await client.query("SELECT id FROM users WHERE email = $1", [s.email]);
    if (existing.rows.length > 0) {
      studentIds.push(existing.rows[0].id);
      continue;
    }
    const inserted = await client.query(
      `INSERT INTO users (name, email, password, role, status)
       VALUES ($1, $2, $3, 'STUDENT', 'ACTIVE')
       RETURNING id`,
      [s.name, s.email, hashedPassword]
    );
    studentIds.push(inserted.rows[0].id);
    studentsCreated++;
  }

  return { studentIds, studentsCreated };
}

async function seedAttemptsAndAnswers(client, studentIds, quizRecords) {
  // Idempotency: wipe only attempts that belong to a seeded student on a
  // seeded quiz, then recreate them fresh. Answers cascade-delete with
  // their attempt. Real users/quizzes/attempts outside these id sets are
  // never touched.
  const quizIds = quizRecords.map((q) => q.id);
  await client.query(
    `DELETE FROM attempts WHERE user_id = ANY($1::int[]) AND quiz_id = ANY($2::int[])`,
    [studentIds, quizIds]
  );

  // Build all possible (student, quiz) pairs and take a random subset.
  const pairs = [];
  for (const studentId of studentIds) {
    for (const quiz of quizRecords) {
      pairs.push({ studentId, quiz });
    }
  }
  const chosenPairs = shuffle(pairs).slice(0, Math.min(TOTAL_ATTEMPTS_TARGET, pairs.length));

  let attemptsCreated = 0;
  let answersCreated = 0;

  for (const { studentId, quiz } of chosenPairs) {
    const totalQuestions = quiz.questions.length;
    const totalMarks = quiz.questions.reduce((sum, q) => sum + q.marks, 0);

    // Pick a performance profile for variety: high / average / low scorers.
    const profileRoll = Math.random();
    let correctCount;
    if (profileRoll < 0.35) {
      // high scorer
      correctCount = randomInt(Math.max(0, totalQuestions - 1), totalQuestions);
    } else if (profileRoll < 0.75) {
      // average scorer
      correctCount = randomInt(Math.ceil(totalQuestions / 2) - 1, Math.ceil(totalQuestions / 2) + 1);
    } else {
      // low scorer / likely fail
      correctCount = randomInt(0, Math.max(0, Math.floor(totalQuestions / 2) - 1));
    }
    correctCount = Math.max(0, Math.min(totalQuestions, correctCount));

    // Occasionally leave a question or two unanswered.
    const maxUnanswered = totalQuestions - correctCount;
    const unanswered = Math.random() < 0.25 ? randomInt(0, Math.min(1, maxUnanswered)) : 0;
    const incorrectCount = totalQuestions - correctCount - unanswered;

    const score = quiz.questions.slice(0, correctCount).reduce((sum, q) => sum + q.marks, 0);
    // Approximate score by marks-per-question when marks vary; here all
    // seeded questions carry 1 mark each so score === correctCount.
    const percentage = totalMarks > 0 ? Number(((score / totalMarks) * 100).toFixed(2)) : 0;
    const status = percentage >= quiz.passing_score ? "PASSED" : "FAILED";

    const maxSeconds = quiz.duration * 60;
    const timeTaken = randomInt(Math.floor(maxSeconds * 0.4), maxSeconds);

    const startedAt = randomPastDate(DAYS_BACK);
    const completedAt = new Date(startedAt.getTime() + timeTaken * 1000);

    const insertedAttempt = await client.query(
      `INSERT INTO attempts
         (quiz_id, user_id, score, percentage, correct_answers, incorrect_answers, unanswered,
          time_taken, status, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        quiz.id,
        studentId,
        score,
        percentage,
        correctCount,
        incorrectCount,
        unanswered,
        timeTaken,
        status,
        startedAt,
        completedAt,
      ]
    );
    const attemptId = insertedAttempt.rows[0].id;
    attemptsCreated++;

    // Assign correctness per question: shuffle question order, first
    // `correctCount` get the correct option, next `incorrectCount` get a
    // random wrong option, the rest are left unanswered.
    const orderedQuestions = shuffle(quiz.questions);

    for (let i = 0; i < orderedQuestions.length; i++) {
      const question = orderedQuestions[i];
      let selectedOptionId = null;
      let isCorrect = null;

      if (i < correctCount) {
        const correctOption = question.options.find((o) => o.is_correct);
        selectedOptionId = correctOption.id;
        isCorrect = true;
      } else if (i < correctCount + incorrectCount) {
        const wrongOptions = question.options.filter((o) => !o.is_correct);
        selectedOptionId = wrongOptions[randomInt(0, wrongOptions.length - 1)].id;
        isCorrect = false;
      } // else: left unanswered -> selectedOptionId stays null, isCorrect stays null

      await client.query(
        `INSERT INTO answers (attempt_id, question_id, selected_option_id, is_correct)
         VALUES ($1, $2, $3, $4)`,
        [attemptId, question.id, selectedOptionId, isCorrect]
      );
      answersCreated++;
    }
  }

  return { attemptsCreated, answersCreated };
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Use the existing admin account (seeded by schema.sql) as created_by
    // for demo quizzes, if present. Falls back to NULL (allowed by schema)
    // if no admin exists yet.
    const adminResult = await client.query(
      "SELECT id FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1"
    );
    const adminUserId = adminResult.rows.length > 0 ? adminResult.rows[0].id : null;

    const categoryIdByName = await seedCategories(client);

    const { quizRecords, quizzesCreated, questionsCreated } = await seedQuizzesAndQuestions(
      client,
      categoryIdByName,
      adminUserId
    );

    const { studentIds, studentsCreated } = await seedStudents(client);

    const { attemptsCreated, answersCreated } = await seedAttemptsAndAnswers(
      client,
      studentIds,
      quizRecords
    );

    await client.query("COMMIT");

    console.log("");
    console.log("Seed completed successfully.");
    console.log("");
    console.log(`Categories: ${CATEGORIES.length}`);
    console.log(`Quizzes: ${QUIZZES.length} (${quizzesCreated} newly created, ${QUIZZES.length - quizzesCreated} already existed)`);
    console.log(`Questions: ${questionsCreated > 0 ? questionsCreated : "0 newly created (quizzes already had questions)"}`);
    console.log(`Students: ${STUDENTS.length} (${studentsCreated} newly created, ${STUDENTS.length - studentsCreated} already existed)`);
    console.log(`Attempts: ${attemptsCreated}`);
    console.log(`Answers: ${answersCreated}`);
    console.log("");
    console.log("Student demo password:");
    console.log(STUDENT_PASSWORD);
    console.log("");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed, transaction rolled back:");
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();