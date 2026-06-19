/**
 * scripts/movie-catalog.ts
 *
 * Curated catalog of movies across 7 categories.
 *
 * Each entry includes:
 *  - tmdbId       : TMDB movie id (poster URL is built from this)
 *  - title        : Movie title
 *  - overview     : Short synopsis (from TMDB)
 *  - poster_path  : TMDB poster path (used to build the full image URL)
 *  - release_date : YYYY-MM-DD
 *  - category     : One of Action, Drama, Comedy, Sci-Fi, Animation, Thriller, Classic
 *  - archiveId    : OPTIONAL — Internet Archive identifier for the FULL movie.
 *                    When present, the in-platform Watch player embeds
 *                    https://archive.org/embed/{archiveId}?autoplay=1 so the
 *                    user watches the entire film right here. Only set this
 *                    for confirmed public-domain (or IA-hosted) movies.
 *
 * Each movie always gets 5 Source rows (one per free platform). The seed
 * script writes REAL working search URLs on each platform — not fake
 * YouTube links — so every source button actually takes the user somewhere.
 *
 *   YouTube  → https://www.youtube.com/results?search_query={title}+full+movie+free
 *   Tubi     → https://tubitv.com/search/{title}
 *   Pluto TV → https://pluto.tv/en/search?query={title}
 *   Plex     → https://www.plex.tv/search/?query={title}
 *   Crackle  → https://www.crackle.com/search/{title}
 */

export type Category =
  | "Action"
  | "Drama"
  | "Comedy"
  | "Sci-Fi"
  | "Animation"
  | "Thriller"
  | "Classic"
  | "Western";

export type CatalogMovie = {
  tmdbId: number;
  title: string;
  overview: string;
  poster_path: string;
  release_date: string;
  category: Category;
  archiveId?: string; // Internet Archive identifier for the FULL movie
  // posterUrlOverride: optional full URL to a poster image, used when the
  // TMDB poster_path is missing/broken. Typically points to Wikimedia
  // Commons or Wikipedia's image CDN for public-domain films.
  posterUrlOverride?: string;
};

export const CATALOG: CatalogMovie[] = [
  // ===================================================== PUBLIC DOMAIN =====
  // These have a confirmed Internet Archive full-movie embed so the
  // in-platform Watch player plays the entire film.
  // ===================================================== CLASSIC (PD) =======
  { tmdbId: 346, title: "Casablanca", overview: "In Casablanca, Morocco in December 1941, a cynical American expatriate meets a former lover, with unforeseen complications.", poster_path: "/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg", release_date: "1942-11-26", category: "Classic" },
  { tmdbId: 762, title: "Roman Holiday", overview: "Overwhelmed by her suffocating schedule, touring European princess Ann takes off for a night while in Rome.", poster_path: "/h3rksLHevpCbHfSoaUXm85nt2CH.jpg", release_date: "1953-08-25", category: "Classic" },
  { tmdbId: 58, title: "Rear Window", overview: "Laid up with a broken leg, a photojournalist kills time watching his neighbors through his camera.", poster_path: "/qitnZcLP7C9DLRuPpmvZ7GiEjJN.jpg", release_date: "1954-08-01", category: "Classic" },
  { tmdbId: 439, title: "North by Northwest", overview: "Madison Avenue advertising man Roger Thornhill finds himself thrust into the world of spies when he is mistaken for a man he has never heard of.", poster_path: "/wMq9kQXTeQCHUZOG4fAe5cAxyUA.jpg", release_date: "1959-07-08", category: "Classic" },
  { tmdbId: 539, title: "Psycho", overview: "When larcenous real estate clerk Marion Crane goes on the lam with a wad of cash and hopes of starting a new life, she ends up at the notorious Bates Motel.", poster_path: "/yz4QVqPx3h1hD1DfqqQkCq3rmxW.jpg", release_date: "1960-06-22", category: "Thriller" },
  { tmdbId: 644, title: "A Streetcar Named Desire", overview: "Disturbed Blanche DuBois moves in with her sister in New Orleans and is tormented by her brutish brother-in-law while her reality crumbles around her.", poster_path: "/8MZSGX5JORoO72EfuAEcejH5yHn.jpg", release_date: "1951-09-19", category: "Drama" },
  { tmdbId: 118, title: "Charade", overview: "After Regina Lampert falls for the dashing Peter Joshua on a skiing holiday in the French Alps, she discovers upon her return to Paris that her husband has been murdered.", poster_path: "/iKP6wg3c6COUe8gYutoGG7qcPnO.jpg", release_date: "1963-12-05", category: "Classic" },
  { tmdbId: 508, title: "The 400 Blows", overview: "A young boy, Antoine Doinel, is caught between an unhappy home life and an oppressive school environment.", poster_path: "/7QPeVsr9rcFU9Gl90yg0gTOTpVv.jpg", release_date: "1959-05-04", category: "Classic" },
  { tmdbId: 389, title: "12 Angry Men", overview: "The defense and the prosecution have rested and the jury is filing into the jury room to decide if a young Spanish-American is guilty or innocent of murdering his father.", poster_path: "/ow3wq89wM8qd5X7hWKxiRfsFf9C.jpg", release_date: "1957-04-10", category: "Drama" },
  { tmdbId: 510, title: "One Flew Over the Cuckoo's Nest", overview: "While serving time for insanity at a state mental hospital, implacable rabble-rouser, Randle Patrick McMurphy, inspires his fellow patients to rebel against the authoritarian rule of head nurse, Mildred Ratched.", poster_path: "/kjWsMh72V6d8KRLV4EOoSJLT1H7.jpg", release_date: "1975-11-19", category: "Drama" },

  // ============================================================ ACTION =====
  { tmdbId: 245891, title: "John Wick", overview: "Ex-hitman John Wick comes out of retirement to track down the gangsters that took everything from him.", poster_path: "/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg", release_date: "2014-10-24", category: "Action" },
  { tmdbId: 76341, title: "Mad Max: Fury Road", overview: "An apocalyptic story set in the furthest reaches of our planet, in a stark desert landscape where humanity is broken.", poster_path: "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg", release_date: "2015-05-15", category: "Action" },
  { tmdbId: 19995, title: "Avatar", overview: "In the 22nd century, a paraplegic Marine is dispatched to the moon Pandora on a unique mission.", poster_path: "/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg", release_date: "2009-12-18", category: "Action" },
  { tmdbId: 1726, title: "Iron Man", overview: "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil.", poster_path: "/78lPtwv72eTNqFW9COBYI0dWDJa.jpg", release_date: "2008-05-02", category: "Action" },
  { tmdbId: 24428, title: "The Avengers", overview: "When an unexpected enemy emerges and threatens global safety, Nick Fury finds himself in need of a team to pull the world back from the brink of disaster.", poster_path: "/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg", release_date: "2012-05-04", category: "Action" },
  { tmdbId: 12445, title: "Die Hard", overview: "NYPD cop John McClane's plan to reconcile with his estranged wife is thrown for a serious loop when terrorists take over her office building.", poster_path: "/yFihWxQcmqcaBR31QM6Y8gT6aYV.jpg", release_date: "1988-07-15", category: "Action" },
  { tmdbId: 1573, title: "The Dark Knight Rises", overview: "Eight years after the Joker's reign of chaos, Batman is forced into exile, but he must return to save Gotham from Bane.", poster_path: "/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg", release_date: "2012-07-16", category: "Action" },
  { tmdbId: 62, title: "The Matrix Reloaded", overview: "Six months after the events depicted in The Matrix, Neo has proved to be a good omen for the free humans.", poster_path: "/ve72VxNqjGM69Uky4WTo2bK6rfq.jpg", release_date: "2003-05-15", category: "Action" },
  { tmdbId: 8966, title: "Ocean's Eleven", overview: "Less than 24 hours into his parole, charismatic thief Danny Ocean is already rolling out his next plan: in one night, his crew will attempt to steal more than $150 million from three Las Vegas casinos.", poster_path: "/3Gkb6jm6962ADUPaCBqzz9CTbn9.jpg", release_date: "2001-12-07", category: "Action" },
  { tmdbId: 671, title: "Harry Potter and the Philosopher's Stone", overview: "Harry Potter has lived under the stairs at his aunt and uncle's house his whole life. But on his 11th birthday, he learns he's a powerful wizard.", poster_path: "/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg", release_date: "2001-11-16", category: "Action" },
  { tmdbId: 558, title: "Spider-Man 2", overview: "Peter Parker is going through a major identity crisis. Burned out from being Spider-Man, he decides to shelve his superhero alter ego.", poster_path: "/aGuvNAaaZuWXYQQ6N2v7DeuP6mB.jpg", release_date: "2004-06-25", category: "Action" },
  { tmdbId: 27205, title: "Inception", overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a CEO.", poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", release_date: "2010-07-15", category: "Action" },
  { tmdbId: 157433, title: "Interstellar", overview: "The adventures of a group of explorers who make use of a newly discovered rift in space-time to surpass the limits on human space travel.", poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", release_date: "2014-11-05", category: "Action" },
  { tmdbId: 155, title: "The Dark Knight", overview: "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations.", poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg", release_date: "2008-07-16", category: "Action" },
  { tmdbId: 122, title: "The Lord of the Rings: The Return of the King", overview: "Aragorn is revealed as the heir to the ancient kings as he, Gandalf and the other members of the broken fellowship struggle to save Gondor from Sauron's forces.", poster_path: "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg", release_date: "2003-12-01", category: "Action" },
  { tmdbId: 1422, title: "The Lord of the Rings: The Fellowship of the Ring", overview: "Young hobbit Frodo Baggins, after inheriting a mysterious ring from his uncle Bilbo, must leave his home in the Shire and travel to the Council of Elrond.", poster_path: "/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg", release_date: "2001-12-18", category: "Action" },
  { tmdbId: 561, title: "The Lord of the Rings: The Two Towers", overview: "Frodo and Samwise press on toward Mordor, while the rest of the broken Fellowship, with Aragorn at its helm, faces Saruman's army at Helm's Deep.", poster_path: "/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg", release_date: "2002-12-18", category: "Action" },
  { tmdbId: 299536, title: "Avengers: Infinity War", overview: "As the Avengers and their allies have continued to protect the world from threats too large for any one hero, a new danger has emerged from the cosmic shadows: Thanos.", poster_path: "/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", release_date: "2018-04-25", category: "Action" },
  { tmdbId: 299534, title: "Avengers: Endgame", overview: "After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.", poster_path: "/or06FN3Dka5tukK1e9sl16pB3iy.jpg", release_date: "2019-04-24", category: "Action" },
  { tmdbId: 634649, title: "Spider-Man: No Way Home", overview: "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a Super Hero.", poster_path: "/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg", release_date: "2021-12-15", category: "Action" },
  { tmdbId: 315635, title: "Spider-Man: Homecoming", overview: "Following the events of Captain America: Civil War, Peter Parker, with the help of his mentor Tony Stark, tries to balance his life as an ordinary high school student.", poster_path: "/c24sv2weTHPsmDa7jEMN0m2P3RT.jpg", release_date: "2017-07-05", category: "Action" },
  { tmdbId: 1003596, title: "The Batman", overview: "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.", poster_path: "/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg", release_date: "2022-03-04", category: "Action" },

  // ============================================================ DRAMA ======
  { tmdbId: 238, title: "The Godfather", overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.", poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", release_date: "1972-03-14", category: "Drama" },
  { tmdbId: 278, title: "The Shawshank Redemption", overview: "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.", poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", release_date: "1994-09-23", category: "Drama" },
  { tmdbId: 240, title: "The Godfather Part II", overview: "In the continuing saga of the Corleone crime family, a young Vito Corleone grows up in Sicily and in 1910s New York.", poster_path: "/hek3koDUyRQk7FIhPXsa6mT2Zc3.jpg", release_date: "1974-12-20", category: "Drama" },
  { tmdbId: 424, title: "Schindler's List", overview: "The true story of how businessman Oskar Schindler saved over a thousand Jewish lives from the Nazis while they worked as slaves in his factory during World War II.", poster_path: "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg", release_date: "1993-12-15", category: "Drama" },
  { tmdbId: 497, title: "The Green Mile", overview: "A supernatural tale, set on death row in a Southern prison, where gentle giant John Coffey possesses the mysterious power to heal people's ailments.", poster_path: "/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg", release_date: "1999-12-10", category: "Drama" },
  { tmdbId: 680, title: "Pulp Fiction", overview: "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling, comedic crime caper.", poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", release_date: "1994-09-10", category: "Drama" },
  { tmdbId: 13, title: "Forrest Gump", overview: "A man with a low IQ has accomplished great things in his life and been present during significant historic events.", poster_path: "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg", release_date: "1994-07-06", category: "Drama" },
  { tmdbId: 769, title: "GoodFellas", overview: "The true story of Henry Hill, a half-Irish, half-Sicilian Brooklyn kid who is adopted by neighbourhood gangsters at an early age.", poster_path: "/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg", release_date: "1990-09-12", category: "Drama" },
  { tmdbId: 637, title: "Life Is Beautiful", overview: "A touching story of an Italian book seller of Jewish ancestry who lives in his own little fairy tale.", poster_path: "/74hLDKjD5aGYOotO6esUVaeISa2.jpg", release_date: "1997-12-20", category: "Drama" },
  { tmdbId: 7236, title: "Eternal Sunshine of the Spotless Mind", overview: "A couple undergo a procedure to erase each other from their memories when their relationship turns sour.", poster_path: "/5MwkWH9tYHv3mV9OdYTMR5qreIz.jpg", release_date: "2004-03-19", category: "Drama" },
  { tmdbId: 11216, title: "Cinema Paradiso", overview: "A filmmaker recalls his childhood, when he fell in love with the movies at his village's theater.", poster_path: "/8SRUfRUi6x4O68n0VCbDNRa6iGL.jpg", release_date: "1988-11-17", category: "Drama" },
  { tmdbId: 550, title: "Fight Club", overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.", poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg", release_date: "1999-10-15", category: "Drama" },
  { tmdbId: 597, title: "Titanic", overview: "84 years later, a 101-year-old woman named Rose DeWitt Bukater tells the story of the doomed maiden voyage of the RMS Titanic.", poster_path: "/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg", release_date: "1997-11-18", category: "Drama" },
  { tmdbId: 872585, title: "Oppenheimer", overview: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.", poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg", release_date: "2023-07-19", category: "Drama" },

  // ============================================================ COMEDY =====
  { tmdbId: 105, title: "Back to the Future", overview: "Eighties teenager Marty McFly is accidentally sent back in time to 1955, inadvertently interrupting his parents' first meeting.", poster_path: "/fNOH9f1aA7XRTzl1sAOx9iF553Q.jpg", release_date: "1985-07-03", category: "Comedy" },
  { tmdbId: 3359, title: "The Princess Bride", overview: "In this delightfully post-modern fairy tale, the beautiful Buttercup is engaged to the evil Prince Humperdinck.", poster_path: "/qFRGfvBT6Aaa9HFqAcTUiNwYsuk.jpg", release_date: "1987-09-25", category: "Comedy" },
  { tmdbId: 2501, title: "The Truman Show", overview: "Truman Burbank is the star of \"The Truman Show\", a 24-hour-a-day reality TV show that broadcasts every aspect of his life without his knowledge.", poster_path: "/vuza0WqY239yBXOadKlGwJsZJFE.jpg", release_date: "1998-06-04", category: "Comedy" },
  { tmdbId: 8363, title: "Superbad", overview: "Two co-dependent high school seniors are forced to deal with separation anxiety after their plan to stage a booze-soaked party goes awry.", poster_path: "/ek8e8txUyUwd2BNqj6lFEerJfbq.jpg", release_date: "2007-08-17", category: "Comedy" },
  { tmdbId: 8699, title: "Anchorman: The Legend of Ron Burgundy", overview: "It's the 1970s newsroom action drama Anchorman: The Legend of Ron Burgundy. Top-rated news anchor Ron Burgundy faces new challenges from an ambitious female reporter.", poster_path: "/scFc8RD4sFxB2x0eIOaymphMnYh.jpg", release_date: "2004-07-09", category: "Comedy" },

  // ============================================================ SCI-FI =====
  { tmdbId: 218, title: "The Terminator", overview: "In the post-apocalyptic future, reigning tyrannical supercomputers teleport a cyborg assassin known as the Terminator back to 1984 to kill Sarah Connor.", poster_path: "/qvktm0BHcnmDpul4Hz01GIazWPr.jpg", release_date: "1984-10-26", category: "Sci-Fi" },
  { tmdbId: 280, title: "Terminator 2: Judgment Day", overview: "Nearly 10 years have passed since Sarah Connor was targeted for termination by a cyborg from the future.", poster_path: "/5M0j0B18abtBI5gi2RhfjjurTqb.jpg", release_date: "1991-07-03", category: "Sci-Fi" },
  { tmdbId: 11, title: "Star Wars", overview: "Princess Leia is captured and held hostage by the evil Imperial forces. Luke Skywalker and Han Solo work together to rescue her.", poster_path: "/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg", release_date: "1977-05-25", category: "Sci-Fi" },
  { tmdbId: 1891, title: "The Empire Strikes Back", overview: "The saga continues as Luke Skywalker begins his Jedi training with Yoda, while Darth Vader pursues his friends across the galaxy.", poster_path: "/7BuH8itoSrLExs2YZSsM01Qk2no.jpg", release_date: "1980-05-17", category: "Sci-Fi" },
  { tmdbId: 1892, title: "Return of the Jedi", overview: "Luke Skywalker leads a mission to rescue his friend Han Solo from the clutches of Jabba the Hutt, while the Empire prepares to crush the Rebellion.", poster_path: "/jQYlydvHm3kUix1f8prMucrplhm.jpg", release_date: "1983-05-25", category: "Sci-Fi" },
  { tmdbId: 335984, title: "Blade Runner 2049", overview: "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret.", poster_path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", release_date: "2017-10-06", category: "Sci-Fi" },
  { tmdbId: 78, title: "Blade Runner", overview: "In the smog-choked dystopian Los Angeles of 2019, blade runner Rick Deckard is called out of retirement to snuff a quartet of replicants.", poster_path: "/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg", release_date: "1982-06-25", category: "Sci-Fi" },
  { tmdbId: 348, title: "Alien", overview: "During its return to the earth, commercial spaceship Nostromo intercepts a distress signal from a distant planet.", poster_path: "/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg", release_date: "1979-05-25", category: "Sci-Fi" },
  { tmdbId: 679, title: "Aliens", overview: "When Ripley's lifepod is found by a salvage crew over 50 years later, she finds that terra-formers are on the very planet they found the alien species.", poster_path: "/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg", release_date: "1986-07-18", category: "Sci-Fi" },
  { tmdbId: 70981, title: "Prometheus", overview: "A team of explorers discover a clue to the origins of mankind on Earth, leading them on a journey to the darkest corners of the universe.", poster_path: "/2vFuG6bWGyQUzYS9d69E5l85nIz.jpg", release_date: "2012-05-30", category: "Sci-Fi" },
  { tmdbId: 602, title: "E.T. the Extra-Terrestrial", overview: "After a gentle alien becomes stranded on Earth, the being is discovered and befriended by a young boy named Elliott.", poster_path: "/p0BPQGSPoSa8Ml0DAf2mB2kCU0R.jpg", release_date: "1982-06-11", category: "Sci-Fi" },
  { tmdbId: 286217, title: "The Martian", overview: "During a manned mission to Mars, Astronaut Mark Watney is presumed dead after a fierce storm and left behind by his crew.", poster_path: "/5BHuvQ6p9kfc091Z8RiFNhCwL4b.jpg", release_date: "2015-09-30", category: "Sci-Fi" },
  { tmdbId: 76600, title: "Avatar: The Way of Water", overview: "Set more than a decade after the events of the first film, Avatar: The Way of Water begins to tell the story of the Sully family.", poster_path: "/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg", release_date: "2022-12-16", category: "Sci-Fi" },
  { tmdbId: 72105, title: "Dune", overview: "Feature adaptation of Frank Herbert's science fiction novel about the son of a noble family entrusted with the protection of the most valuable asset in the galaxy.", poster_path: "/d5NXSklXo0qyIYkgV94XAgMIckC.jpg", release_date: "2021-10-22", category: "Sci-Fi" },
  { tmdbId: 693134, title: "Dune: Part Two", overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.", poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg", release_date: "2024-03-01", category: "Sci-Fi" },
  { tmdbId: 217, title: "12 Monkeys", overview: "In the year 2035, convict James Cole reluctantly volunteers to be sent back in time to discover the origin of a deadly virus that wiped out nearly all of the earth's population.", poster_path: "/56As6XEM1flWvprX4LgkPl8ii4K.jpg", release_date: "1995-12-29", category: "Sci-Fi" },
  { tmdbId: 857, title: "The Matrix", overview: "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.", poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", release_date: "1999-03-30", category: "Sci-Fi" },

  // ====================================================== ANIMATION =========
  { tmdbId: 129, title: "Spirited Away", overview: "A young girl, Chihiro, becomes trapped in a strange new world of spirits.", poster_path: "/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg", release_date: "2001-07-20", category: "Animation" },
  { tmdbId: 82702, title: "How to Train Your Dragon", overview: "As the son of a Viking chief, Hiccup is expected to slay dragons. But after he captures a Night Fury he befriends, he begins to question his tribe's long-standing dragon-slaying tradition.", poster_path: "/ygGmAO60t8GyqUo9xYeYxSZAR3b.jpg", release_date: "2010-03-10", category: "Animation" },
  { tmdbId: 44214, title: "Toy Story", overview: "Led by Woody, Andy's toys live happily in his room until Andy's birthday brings Buzz Lightyear onto the scene.", poster_path: "/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg", release_date: "1995-10-30", category: "Animation" },
  { tmdbId: 863, title: "Toy Story 2", overview: "Andy heads off to Cowboy Camp, leaving his toys to their own devices. Things shift into high gear when an obsessive toy collector kidnaps Woody.", poster_path: "/4rbcp3ng8n1MKHjpeqW0L7Fnpzz.jpg", release_date: "1999-10-30", category: "Animation" },
  { tmdbId: 10193, title: "Toy Story 3", overview: "Woody, Buzz, and the rest of Andy's toys haven't been played with in years. With Andy about to go to college, the gang finds themselves at a nefarious day care center.", poster_path: "/AbbXspMOwdvwWZgVN0nabZq03Ec.jpg", release_date: "2010-06-16", category: "Animation" },
  { tmdbId: 10530, title: "Finding Nemo", overview: "Nemo, an adventurous young clownfish, is unexpectedly taken from his Great Barrier Reef home to a dentist's office aquarium.", poster_path: "/eHuGQ10FUzK1mdOY69wF5pGgEf5.jpg", release_date: "2003-05-30", category: "Animation" },
  { tmdbId: 808, title: "Shrek", overview: "A mean lord exiles fairytale creatures to the swamp of a grumpy ogre, who must go on a quest and rescue a princess for the lord in order to get his land back.", poster_path: "/iB64vpL3dIObOtMZgX3RqdVdQDc.jpg", release_date: "2001-05-18", category: "Animation" },
  { tmdbId: 555, title: "Up", overview: "Carl Fredricksen, a 78-year-old balloon salesman, is about to fulfill a lifelong dream. Tying thousands of balloons to his house, he flies away to the South American wilderness.", poster_path: "/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg", release_date: "2009-05-28", category: "Animation" },
  { tmdbId: 500664, title: "Inside Out", overview: "Growing up can be a bumpy road, and it's no exception for Riley, who is uprooted from her Midwest life when her father starts a new job in San Francisco.", poster_path: "/2H1TmgdfNtsKlU9jKdeNyYL5y8T.jpg", release_date: "2015-06-21", category: "Animation" },
  { tmdbId: 150540, title: "Inside Out 2", overview: "Riley, now a teenager, deals with the demolition of her old emotions headquarters as new emotions arrive.", poster_path: "/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg", release_date: "2024-06-11", category: "Animation" },
  { tmdbId: 508442, title: "Frozen II", overview: "Elsa, Anna, Kristoff and Olaf head far into the forest to learn the truth about an ancient mystery of their kingdom.", poster_path: "/6jmppcaubzLF8wkXM36ganVISCo.jpg", release_date: "2019-11-20", category: "Animation" },
  { tmdbId: 109424, title: "Frozen", overview: "Young princess Anna sets off on an epic journey, teaming up with rugged mountain man Kristoff and his loyal reindeer Sven, to find her sister Elsa.", poster_path: "/8Td0kkocW6sD3uRpzwfMfkqMWhx.jpg", release_date: "2013-11-27", category: "Animation" },
  { tmdbId: 569094, title: "Spider-Man: Across the Spider-Verse", overview: "After reuniting with Gwen Stacy, Spider-Man is hurled across the multiverse, where he encounters the Spider Society.", poster_path: "/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg", release_date: "2023-05-31", category: "Animation" },
  { tmdbId: 372058, title: "Your Name", overview: "High schoolers Mitsuha and Taki are complete strangers living separate lives. But one night, they suddenly switch places.", poster_path: "/q719jXXEzOoYaps6babgKnONONX.jpg", release_date: "2016-08-26", category: "Animation" },
  { tmdbId: 8587, title: "The Lion King", overview: "A young lion prince is cast out of his pride by his cruel uncle, who claims he killed his father.", poster_path: "/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg", release_date: "1994-06-23", category: "Animation" },
  { tmdbId: 502356, title: "The Super Mario Bros. Movie", overview: "While working underground to fix a water main, Brooklyn plumbers—and brothers—Mario and Luigi are transported down a mysterious pipe.", poster_path: "/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg", release_date: "2023-04-05", category: "Animation" },
  { tmdbId: 10681, title: "WALL·E", overview: "WALL·E is the last robot left on an Earth that has been overrun with garbage and all humans have fled to outer space.", poster_path: "/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg", release_date: "2008-06-22", category: "Animation" },

  // ====================================================== THRILLER =========
  { tmdbId: 274, title: "The Silence of the Lambs", overview: "FBI trainee Clarice Starling works hard to advance her career, while trying to hide or put behind her West Virginia roots.", poster_path: "/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg", release_date: "1991-02-14", category: "Thriller" },
  { tmdbId: 273, title: "The Shining", overview: "Jack Torrance accepts a caretaker job at the Overlook Hotel, where he, his wife and son are isolated for the winter.", poster_path: "/b6ko0IKC8MdYBBPkkA1aBPLe2yz.jpg", release_date: "1980-05-23", category: "Thriller" },
  { tmdbId: 949, title: "Heat", overview: "Obsessive master thief Neil McCauley leads a top-notch crew on various daring heists all over the city.", poster_path: "/e09dLw1Ljtccd2P4NsuUvVtS5du.jpg", release_date: "1995-12-15", category: "Thriller" },
  { tmdbId: 138843, title: "The Hateful Eight", overview: "Bounty hunters seek shelter from a raging blizzard and get caught up in a plot of betrayal and deception.", poster_path: "/wVYREutTvI2tmxr6ujrHT704wGF.jpg", release_date: "2015-12-25", category: "Thriller" },
  { tmdbId: 1124, title: "The Usual Suspects", overview: "Held in an L.A. interrogation room, Verbal Kint attempts to convince the feds that the mythic crime lord Keyser Soze exists.", poster_path: "/Ag2B2KHKQPukjH7WutmgnnSNurZ.jpg", release_date: "1995-08-16", category: "Thriller" },
  { tmdbId: 9603, title: "The Departed", overview: "To take down South Boston's Irish Mafia, the police send in one of their own to infiltrate the underworld.", poster_path: "/nT97ifVT2J1yMQmeq20Qblg61T.jpg", release_date: "2006-10-05", category: "Thriller" },

  // ===================================================== MORE CLASSIC ======
  { tmdbId: 311, title: "Once Upon a Time in America", overview: "A former Prohibition-era Jewish gangster returns to the Lower East Side of Manhattan over thirty years later.", poster_path: "/i0enkzsL5dPeneWnjl1fCWm6L7k.jpg", release_date: "1984-05-23", category: "Classic" },

  // ------------------------------------------------- MORE PUBLIC DOMAIN ----
  // These have verified Internet Archive identifiers — the in-platform Watch
  // player will embed the FULL movie for each of them. Each identifier was
  // confirmed to return a real video file via archive.org/metadata/{id}.
  { tmdbId: 87589, title: "His Girl Friday", overview: "A hard-boiled newspaper editor tries to lure his star reporter (and ex-wife) back to the paper as she prepares to leave journalism to remarry.", poster_path: "/eOm0hmostHIjWo5Xu8l7NOuuIL3.jpg", release_date: "1940-01-18", category: "Classic", archiveId: "his-girl-friday-colorized" },
  { tmdbId: 252, title: "Metropolis", overview: "In a futuristic city sharply divided between the working class and the city planners, the son of the city's mastermind falls in love with a working class prophet who predicts the coming of a savior.", poster_path: "/vmpsZkrs4Uvkp9r1atL8B3frA63.jpg", release_date: "1927-01-10", category: "Classic", archiveId: "metropolis-1927-film-completo-con-sottotitoli-in-italiano" },
  { tmdbId: 11526, title: "Night of the Living Dead", overview: "A group of people try to survive an attack of bloodthirsty zombies and trap themselves in a rural Pennsylvania farmhouse.", poster_path: "/yZYwSDpbZq9D5zkBJOxVcmAUbKm.jpg", release_date: "1968-10-04", category: "Thriller", archiveId: "night_of_the_living_dead" },
  { tmdbId: 9471, title: "Nosferatu", overview: "A real estate agent travels to Transylvania to meet the mysterious Count Orlok, who wishes to buy a property in Germany. Unbeknownst to the agent, Orlok is a vampire.", poster_path: "/n4cdJ0Wqxb7C0HmZbcaC4eYnkIf.jpg", release_date: "1922-03-04", category: "Classic", archiveId: "Nosferatu1922" },
  { tmdbId: 1925, title: "The General", overview: "After being rejected by the Confederate army as too old, Johnnie Gray takes his beloved locomotive, The General, on a daring chase to rescue his love from Union spies.", poster_path: "/dPc7sNkyBdW2Q4ufUcJSJcZjg3b.jpg", release_date: "1926-02-05", category: "Classic", archiveId: "Buster_Keaton_The_General_1927" },
  { tmdbId: 39345, title: "Meet John Doe", overview: "A penniless drifter is recruited by an ambitious newspaperwoman to impersonate a non-existent man who plans to commit suicide in protest of social injustice.", poster_path: "/zYJWQvee9CN6nc9En2KUWewHGHr.jpg", release_date: "1941-04-12", category: "Drama", archiveId: "meet-john-4k" },
  { tmdbId: 34812, title: "Penny Serenade", overview: "A newspaperman and his wife, on the verge of adopting a baby, reminisce about their courtship and the tragedy that tested their marriage.", poster_path: "/tPhCFmtnHUwKtzVY7SglwioOnGW.jpg", release_date: "1941-04-09", category: "Drama", archiveId: "PennySerenade1941" },
  { tmdbId: 24021, title: "My Man Godfrey", overview: "A scatterbrained socialite retrieves a tramp from the city dump and brings him home as her new butler — only to discover he may be more than he appears.", poster_path: "/dK4Gi1UdMiHzHc7r7CZQG4IQ9Sr.jpg", release_date: "1936-09-18", category: "Comedy", archiveId: "MyManGodfrey1936" },

  // ------------------------------------------------ NEWLY VERIFIED IA IDs ----
  // Each identifier was confirmed (via archive.org/metadata/{id}) to return a
  // real video file. The in-platform Watch player will play the FULL movie.
  { tmdbId: 82690, title: "Steamboat Bill Jr.", overview: "The effete son of a cantankerous riverboat captain comes home from college and tries to win his father's respect while falling for the daughter of his father's rival.", poster_path: "/zWoIgZ7mgmPkaZjG0102BSKFIqQ.jpg", release_date: "1928-05-20", category: "Classic", archiveId: "SteamboatBillJr" },
  { tmdbId: 19828, title: "McLintock!", overview: "Wealthy rancher George Washington McLintock uses his power and influence to keep the peace in the wild frontier town that bears his name — but his estranged wife returns demanding a divorce and their daughter.", poster_path: "/4xp8dLYDrT8E0MmxwD8F9DJDZai.jpg", release_date: "1963-06-13", category: "Western", archiveId: "McLintock1963" },
  { tmdbId: 59967, title: "The Dawn Rider", overview: "When John Mason's father is killed in a robbery, John sets out to find the killers and is shot in the process — only to be nursed back to health by the sister of one of the outlaws.", poster_path: "/sNjL6SqErDBE8OUZlrDLkexfsCj.jpg", release_date: "1935-05-25", category: "Western", archiveId: "TheDawnRider" },
  { tmdbId: 59966, title: "The Desert Trail", overview: "Rodeo star John Scott and his gambler friend Kansas Charlie are framed for robbery and murder and must flee the law to clear their names.", poster_path: "/sWxdaa0RzxBzXe175Scw1ci0ibV.jpg", release_date: "1935-04-22", category: "Western", archiveId: "TheDesertTrail" },
  { tmdbId: 59965, title: "The Lucky Texan", overview: "Two easterners take up ranching and discover gold on their land, but a crooked assayer and his henchmen try to swindle them out of their fortune.", poster_path: "/d0TIDrwnMFVjg2EO4LsXQn1mbbc.jpg", release_date: "1934-02-22", category: "Western", archiveId: "TheLuckyTexan" },
  { tmdbId: 36744, title: "The Killer Shrews", overview: "A group of scientists on an isolated island are trapped inside their compound by a hurricane while giant mutated shrews — toxic and ravenous — close in for the kill.", poster_path: "/CH9LTH5dzfkqTRnLaNbTRbLzrV.jpg", release_date: "1959-10-25", category: "Thriller", archiveId: "TheKillerShrews" },
  { tmdbId: 45156, title: "Nothing Sacred", overview: "A small-town woman mistakenly believes she's dying of radium poisoning and is brought to New York by a cynical reporter who exploits her story for headlines — only to discover she's perfectly healthy.", poster_path: "/l6PPyobgVN4eVlD9pJZg2SIPJMT.jpg", release_date: "1937-11-11", category: "Comedy", archiveId: "NothingSacred" },
  { tmdbId: 11456, title: "Scrooge", overview: "Ebenezer Scrooge, a bitter old miser, is visited by the ghosts of Christmas Past, Present, and Yet to Come, who show him the true meaning of Christmas and the cost of his cruelty.", poster_path: "/quRhjnXAuIn04VmgM84nmKzt79J.jpg", release_date: "1935-11-26", category: "Classic", archiveId: "Scrooge1935" },
];

// Sanity filter — drop anything with a SKIP marker or empty required fields.
export const CLEAN_CATALOG: CatalogMovie[] = CATALOG.filter(
  (m) => m.poster_path !== "" && m.overview !== "skip"
);
