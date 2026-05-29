"""
Management command: seed_data

Creates sample users, publishers, articles, and newsletters for development.

Usage:
    python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from newsapp.models import Publisher, Article, Newsletter

User = get_user_model()

ARTICLES = [
    {
        "title": "Breaking: Django 5 Revolutionises Web Development",
        "content": (
            "Django 5 has arrived with a slew of improvements that make building web applications "
            "faster and more enjoyable than ever. Among the highlights are simplified form rendering, "
            "improved async support, and a streamlined admin interface.\n\n"
            "The Django community has rallied around these changes, with thousands of projects already "
            "upgrading in the first week after release. Benchmarks show a 15% reduction in average "
            "response times for database-heavy views, thanks to smarter query batching.\n\n"
            "Migration tooling has also received a significant overhaul. Developers can now detect "
            "conflicting migrations automatically before they reach production, saving hours of debugging."
        ),
        "publisher": True,
    },
    {
        "title": "Independent Report: The State of Open-Source in 2026",
        "content": (
            "Open-source software continues to power the modern internet. This independent analysis "
            "examines the trends, contributors, and funding models that shape the ecosystem today.\n\n"
            "From Linux to React, the software that runs our world is increasingly community-driven "
            "and transparently developed. Corporate sponsorship of open-source projects reached an "
            "all-time high this year, with over $4 billion channelled into foundations and individual "
            "maintainers globally.\n\n"
            "However, sustainability remains a concern. Surveys show that more than 60% of critical "
            "infrastructure packages are maintained by a single person working in their spare time."
        ),
        "publisher": False,
    },
    {
        "title": "AI in the Newsroom: Promise, Peril, and Practice",
        "content": (
            "Newsrooms around the world are quietly integrating large language models into their "
            "editorial workflows. Fact-checking pipelines, headline A/B testing, and automated "
            "transcription are now table stakes at major outlets.\n\n"
            "Critics argue that cost-cutting under the guise of 'AI augmentation' is reducing "
            "headcount without improving accuracy. Three high-profile correction scandals in Q1 2026 "
            "have reignited debates about editorial accountability when algorithms are involved.\n\n"
            "Proponents counter that AI liberates journalists from repetitive tasks, allowing them "
            "to focus on investigations that actually require human judgment."
        ),
        "publisher": True,
    },
    {
        "title": "Climate Tech Funding Hits Record $80 Billion in 2025",
        "content": (
            "Venture capital poured a record $80 billion into climate technology startups in 2025, "
            "surpassing the previous record by nearly 30%. Battery storage, green hydrogen, and "
            "direct air capture attracted the lion's share of investment.\n\n"
            "The surge follows a series of policy incentives in the US, EU, and South-East Asia "
            "that have de-risked early-stage clean-energy projects. Returns on 2021-vintage funds "
            "are beginning to materialise, drawing in limited partners who had previously sat on "
            "the sidelines.\n\n"
            "Not all analysts are bullish. Some warn that the market is bifurcating — proven "
            "technologies are over-capitalised while genuinely novel approaches remain chronically "
            "underfunded."
        ),
        "publisher": True,
    },
    {
        "title": "The Rise of the 15-Minute City: Urban Planning's New Manifesto",
        "content": (
            "Cities from Paris to Nairobi are experimenting with the '15-minute city' concept — "
            "the idea that every essential amenity should be reachable on foot or by bike within "
            "a quarter hour. Early results are promising.\n\n"
            "Barcelona's superblock programme has reduced car traffic by 40% in pilot zones while "
            "improving air quality by measurable margins. Residents report higher wellbeing scores "
            "and stronger community ties.\n\n"
            "Opponents cite gentrification risks, arguing that reduced parking and road space "
            "increases property values and displaces lower-income residents. Planners are now "
            "piloting affordability covenants alongside mobility interventions."
        ),
        "publisher": False,
    },
    {
        "title": "Quantum Computing Reaches a Practical Milestone",
        "content": (
            "A team of researchers announced this week that they have demonstrated a quantum "
            "algorithm solving a real-world logistics problem — optimising delivery routes for "
            "a regional courier network — faster than the best available classical approach.\n\n"
            "The result, peer-reviewed and published in Nature, is being hailed as the first "
            "unambiguous example of practical quantum advantage outside of purely academic settings.\n\n"
            "Industry observers caution that scaling the technique to commercially viable hardware "
            "remains years away, but the milestone shifts the conversation from 'if' to 'when'."
        ),
        "publisher": True,
    },
    {
        "title": "Digital Nomad Visas: Which Countries Are Winning the Talent Race?",
        "content": (
            "More than 60 countries now offer some form of digital nomad visa, up from just a "
            "handful in 2020. The competition for location-independent workers — who spend and "
            "contribute to local economies without displacing residents' jobs — has intensified.\n\n"
            "Portugal, Estonia, and Costa Rica remain the most popular destinations, but newcomers "
            "like Albania and Cape Verde are rapidly climbing the rankings by combining low costs "
            "with streamlined application processes.\n\n"
            "The long-term tax implications of nomadic living are becoming a mainstream concern, "
            "spawning a cottage industry of specialist accountants and legal advisors."
        ),
        "publisher": False,
    },
    {
        "title": "Oceans Under Pressure: A Special Investigation",
        "content": (
            "A year-long investigation by our team has revealed the scale of illegal fishing "
            "activity in the Pacific Ocean. Satellite tracking data, combined with port records "
            "and customs filings, points to a network spanning twelve jurisdictions.\n\n"
            "The economic damage to coastal communities is estimated at $3 billion annually. "
            "Indigenous fishing cooperatives report catch volumes down by as much as 70% in "
            "traditionally rich grounds, threatening food security for hundreds of thousands.\n\n"
            "Regulatory agencies in three countries have confirmed that investigations are ongoing "
            "following our initial disclosure. Two fishing company executives declined to comment."
        ),
        "publisher": True,
    },
    {
        "title": "How Sleep Science Is Reshaping the Workplace",
        "content": (
            "A growing body of evidence linking chronic sleep deprivation to reduced productivity, "
            "higher healthcare costs, and increased accident rates is finally reaching corporate "
            "boardrooms. Nap pods, flexible start times, and 'deep work' scheduling are now "
            "perks at some of the world's most recognisable employers.\n\n"
            "Sceptics argue the changes are superficial — cosmetic responses to a structural "
            "problem of overwork. Union representatives point out that flexible start times mean "
            "little when total working hours remain unchanged.\n\n"
            "Sleep researchers hope that wearable data, increasingly available to HR teams with "
            "employee consent, will make the business case undeniable within five years."
        ),
        "publisher": False,
    },
    {
        "title": "The Streaming Wars Enter Their Consolidation Phase",
        "content": (
            "After a decade of explosive growth, the global video streaming market is consolidating "
            "rapidly. Three major mergers announced in Q4 2025 will reduce the number of major "
            "platforms from nine to five within eighteen months.\n\n"
            "Subscriber fatigue is the driving force. Consumers unwilling to pay for more than "
            "two or three services are forcing platforms to compete on content depth rather than "
            "breadth. Exclusive sports rights have become the primary battleground.\n\n"
            "Analysts predict that the end state will resemble the old cable bundle — a small "
            "number of powerful aggregators offering tiered access to content libraries."
        ),
        "publisher": True,
    },
    {
        "title": "Inside the Push to Regulate Algorithmic Hiring",
        "content": (
            "Automated CV screening, video interview analysis, and psychometric game scores are "
            "now used in the majority of large-company hiring processes. Regulators are catching up.\n\n"
            "The EU's AI Act requires high-risk AI systems — a category that includes hiring tools "
            "— to be transparent, auditable, and free of discriminatory bias. Early enforcement "
            "actions have resulted in fines totalling €140 million across the bloc.\n\n"
            "In the US, a patchwork of state laws is creating compliance headaches for multinational "
            "firms. New York City's Local Law 144 now mandates independent bias audits for any "
            "automated employment decision tool used within the city."
        ),
        "publisher": False,
    },
    {
        "title": "The Rebirth of Public Libraries in the Digital Age",
        "content": (
            "Far from being rendered obsolete by the internet, public libraries are experiencing "
            "a renaissance. Visitor numbers in major cities have returned to pre-pandemic levels "
            "and, in many cases, surpassed them — driven by demand for digital literacy programmes, "
            "community space, and, crucially, air conditioning.\n\n"
            "Libraries have quietly become the front line of digital inclusion. Patrons use library "
            "computers and broadband connections to apply for jobs, access government services, "
            "and take online courses unavailable at home.\n\n"
            "New architectural briefs treat the library as a 'third place' — neither home nor "
            "work — investing heavily in welcoming, flexible interiors that invite lingering."
        ),
        "publisher": True,
    },
    {
        "title": "The Future of Remote Work: Four Years On",
        "content": (
            "What began as an emergency response to a global pandemic has permanently reshaped "
            "where and how knowledge workers do their jobs. Four years on, the data paints a "
            "nuanced picture: hybrid arrangements dominate, pure remote is contracting, and "
            "fully in-office mandates are proving harder to enforce than CEOs anticipated.\n\n"
            "Office space utilisation rates hover around 55% globally, leaving landlords and "
            "city planners to reimagine commercial districts designed for a different era. "
            "Conversion to residential units is accelerating, but planning permission bottlenecks "
            "mean the transformation will take a decade to fully materialise.\n\n"
            "For workers, location flexibility has become a non-negotiable benefit — ranked above "
            "pension contributions in several employee-preference surveys published this year."
        ),
        "publisher": False,
    },
    {
        "title": "Battery Technology Breakthrough Promises Week-Long Phone Charge",
        "content": (
            "Scientists at a Tokyo-based research institute announced a solid-state battery capable "
            "of storing three times the energy of current lithium-ion cells at the same volume. "
            "Early prototypes have demonstrated over 2,000 charge cycles with less than 5% "
            "capacity degradation — comfortably exceeding commercial viability thresholds.\n\n"
            "Consumer electronics are only the beginning. EV manufacturers have signed "
            "memoranda of understanding to gain early access to the technology, with mass "
            "production partnerships expected to be announced in the second half of 2026.\n\n"
            "Analysts caution that scaling laboratory results to factory output is notoriously "
            "difficult in battery chemistry, citing several high-profile disappointments over "
            "the past decade. Independent verification of the claims is ongoing."
        ),
        "publisher": True,
    },
    {
        "title": "Mental Health Apps: A $10 Billion Market Under Scrutiny",
        "content": (
            "The global market for digital mental health tools surpassed $10 billion last year, "
            "attracting venture capital, celebrity endorsements, and regulatory attention in equal "
            "measure. A series of independent studies has questioned whether app-based therapy "
            "delivers meaningful outcomes or merely the appearance of support.\n\n"
            "Regulators in the UK and EU are now applying medical device frameworks to a category "
            "of products that previously operated in a largely unregulated grey area. Companies "
            "face pressure to publish clinical trial data or reclassify their offerings as "
            "wellness tools rather than treatment.\n\n"
            "Practitioners are divided. Many clinicians see apps as a useful adjunct to traditional "
            "therapy, particularly for reaching underserved populations. Others worry about "
            "vulnerable users substituting entertainment for evidence-based care."
        ),
        "publisher": True,
    },
    {
        "title": "How Microgrids Are Powering Rural Communities Off the National Grid",
        "content": (
            "In regions where extending the centralised electricity grid is prohibitively expensive, "
            "microgrids — small, localised power networks combining solar panels, batteries, and "
            "smart controllers — are providing reliable energy for the first time.\n\n"
            "Pilot projects in sub-Saharan Africa, rural India, and island communities across "
            "South-East Asia are showing that community-owned microgrids can achieve 99% uptime "
            "at a fraction of the cost of traditional grid extension.\n\n"
            "The model is also attracting interest in wealthy nations prone to wildfires and "
            "extreme weather. Californian communities devastated by grid-caused ignitions are "
            "exploring microgrids as both a resilience strategy and a way to reduce liability "
            "for utility companies."
        ),
        "publisher": False,
    },
    {
        "title": "The Hidden Costs of Fast Fashion: A Supply Chain Investigation",
        "content": (
            "A six-month investigation tracing the supply chains of ten major fast-fashion "
            "retailers has uncovered widespread underpayment, excessive overtime, and unsafe "
            "working conditions across factories in three continents.\n\n"
            "Despite years of public commitments to ethical sourcing, our findings show that "
            "structural incentives — specifically, the relentless pressure on suppliers to "
            "reduce per-unit costs — make compliance with labour standards economically "
            "irrational for factory owners operating on razor-thin margins.\n\n"
            "Several brands declined to comment; two provided statements asserting that their "
            "supplier codes of conduct meet international standards. Labour rights organisations "
            "say codes without independent enforcement are meaningless."
        ),
        "publisher": True,
    },
    {
        "title": "Neuroscience and Education: What the Research Actually Says",
        "content": (
            "Learning styles, brain training games, and the 'Mozart effect' have all been "
            "debunked by rigorous research — yet they persist in classrooms around the world. "
            "A new wave of educationally-focused neuroscientists is trying to separate myth "
            "from evidence and translate genuine findings into practical pedagogy.\n\n"
            "The science of memory consolidation, spaced repetition, and retrieval practice is "
            "robust and directly applicable. Schools that have systematically applied these "
            "techniques report measurable improvements in long-term retention without increasing "
            "instruction time.\n\n"
            "The challenge is dissemination. Teacher training programmes have been slow to "
            "incorporate cognitive science findings, and commercial interests continue to "
            "market unproven interventions to budget-constrained schools."
        ),
        "publisher": False,
    },
    {
        "title": "Space Tourism Turns Commercial: Who Can Afford the Ride?",
        "content": (
            "With more than 40 private citizens having now reached the edge of space or beyond, "
            "the space tourism industry is maturing from a billionaire novelty into a structured, "
            "if still exclusive, commercial market. Ticket prices have fallen by 60% since 2021 "
            "but remain out of reach for all but the very wealthy.\n\n"
            "Three companies are now offering orbital experiences lasting between 12 hours and "
            "four days, with prices ranging from $250,000 to $1.2 million per seat. "
            "Sub-orbital hops are available from $95,000 — roughly the cost of a luxury "
            "safari or a bespoke Antarctic expedition.\n\n"
            "The environmental calculus is contentious. Per-passenger carbon emissions for "
            "a sub-orbital flight are estimated at 50–100 tonnes — comparable to 50 transatlantic "
            "flights — reigniting debates about the ethics of luxury emissions."
        ),
        "publisher": True,
    },
]


class Command(BaseCommand):
    help = "Seed the database with sample data for development"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # ── Users ──────────────────────────────────────────────────────────
        reader, _ = User.objects.get_or_create(
            username="reader_demo",
            defaults={"role": "reader", "email": "reader@demo.com"},
        )
        reader.set_password("demo1234")
        reader.save()

        journalist, _ = User.objects.get_or_create(
            username="journalist_demo",
            defaults={"role": "journalist", "email": "journalist@demo.com"},
        )
        journalist.set_password("demo1234")
        journalist.save()

        journalist2, _ = User.objects.get_or_create(
            username="journalist2_demo",
            defaults={"role": "journalist", "email": "journalist2@demo.com"},
        )
        journalist2.set_password("demo1234")
        journalist2.save()

        editor, _ = User.objects.get_or_create(
            username="editor_demo",
            defaults={"role": "editor", "email": "editor@demo.com"},
        )
        editor.set_password("demo1234")
        editor.save()

        # ── Publisher ──────────────────────────────────────────────────────
        publisher, _ = Publisher.objects.get_or_create(name="The Daily Observer")
        publisher.journalists.add(journalist, journalist2)
        publisher.editors.add(editor)

        publisher2, _ = Publisher.objects.get_or_create(name="Global Insights")
        publisher2.journalists.add(journalist2)
        publisher2.editors.add(editor)

        # ── Reader subscriptions ───────────────────────────────────────────
        reader.subscribed_publishers.add(publisher)
        reader.subscribed_journalists.add(journalist)

        # ── Articles ───────────────────────────────────────────────────────
        created_articles = []
        # Alternate authorship across the two demo journalists for variety.
        authors = [
            journalist, journalist2, journalist, journalist2, journalist,
            journalist2, journalist, journalist, journalist2, journalist,
            journalist2, journalist, journalist2, journalist, journalist2,
            journalist, journalist2, journalist, journalist2, journalist,
        ]

        for i, (data, author) in enumerate(zip(ARTICLES, authors)):
            pub = publisher if data["publisher"] and i % 3 != 2 else (publisher2 if data["publisher"] else None)
            article, _ = Article.objects.get_or_create(
                title=data["title"],
                defaults={
                    "content": data["content"],
                    "author": author,
                    "publisher": pub,
                    "approved": True,
                    "approved_by": editor,
                },
            )
            created_articles.append(article)

        # One draft (pending)
        Article.objects.get_or_create(
            title="Draft: Upcoming Changes to REST API Design Standards",
            defaults={
                "content": (
                    "This draft article explores the proposed changes to REST API design standards "
                    "being discussed across the industry. Pending editorial review."
                ),
                "author": journalist,
                "publisher": publisher,
                "approved": False,
            },
        )

        # ── Newsletter ─────────────────────────────────────────────────────
        nl, _ = Newsletter.objects.get_or_create(
            title="Weekly Tech Digest",
            defaults={
                "description": "Your weekly roundup of the most important technology news.",
                "author": journalist,
            },
        )
        nl.articles.add(*created_articles[:4])

        nl2, _ = Newsletter.objects.get_or_create(
            title="World Affairs Briefing",
            defaults={
                "description": "Concise coverage of the stories shaping our world this week.",
                "author": journalist2,
            },
        )
        nl2.articles.add(*created_articles[4:8])

        self.stdout.write(self.style.SUCCESS("Done! Demo accounts:"))
        self.stdout.write("  reader_demo      / demo1234  (reader)")
        self.stdout.write("  journalist_demo  / demo1234  (journalist)")
        self.stdout.write("  journalist2_demo / demo1234  (journalist)")
        self.stdout.write("  editor_demo      / demo1234  (editor)")
        self.stdout.write(f"  {len(created_articles)} approved articles seeded")
