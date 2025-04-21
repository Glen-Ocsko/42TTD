import React from 'react';

export default function AboutUs() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">About Us</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600 mb-8">
          Back in 2012, I was challenged to write a bucket list. Not because I was in crisis or stuck in a rut — just because someone thought it'd be hard to come up with 50 things I genuinely wanted to do.
        </p>

        <p className="text-xl text-gray-600 mb-8">
          They were wrong.
        </p>

        <p className="text-xl text-gray-600 mb-8">
          If anything, the challenge was narrowing it down. I'd done loads of amazing things when I was younger, but life — as it often does — got busy. Family, work, routines. I wasn't unhappy, but I realised I was waiting for adventures to find me instead of going out and making them happen.
        </p>

        <p className="text-xl text-gray-600 mb-8">
          So I made a list. Not 50.<br />
          42.
        </p>

        <p className="text-xl text-gray-600 mb-8">
          Because, as any Hitchhiker's Guide to the Galaxy fan will tell you, 42 is the answer to life, the universe and everything. And for me, that answer is simple: live life to the fullest. Fill it with stories, challenges and meaningful moments — big and small.
        </p>

        <h2 className="text-2xl font-bold mt-12 mb-6">I've ticked off some wild ones:</h2>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>I went to Everest (and got helicoptered off the side of the mountain when my brother got altitude sickness — unfinished business there).</li>
          <li>I learned to fly, to sail, and to pick locks.</li>
          <li>I started a business.</li>
          <li>I saw my team play in a cup final.</li>
          <li>I saw my favourite Shakespeare play turned into opera at Glyndebourne.</li>
        </ul>

        <p className="text-xl text-gray-600 mb-8">
          But the most surprising part wasn't what I did — it was how many people showed up to help me do it. A friend who happened to be a flight instructor. A mate who got opera tickets. Someone who knew someone with a racing catamaran.
        </p>

        <p className="text-xl text-gray-600 mb-12">
          That's when it clicked: this wasn't just about my list.<br />
          This could be a spark for anyone's story.
        </p>

        <h2 className="text-3xl font-bold mt-16 mb-8">Why 42 Things To Do?</h2>

        <p className="text-xl text-gray-600 mb-8">
          Because having goals — however big or small, however random or crazy — is how we turn "someday" into "right now."
          Whether it's climbing a mountain, learning to cook a meal from scratch, or finally joining a dance class — it matters.
        </p>

        <div className="bg-blue-50 p-8 rounded-xl mb-12">
          <h3 className="text-xl font-semibold mb-4">We believe in the 1% theory:</h3>
          <p className="text-lg">
            Do one small thing every day that makes your life better by 1%.<br />
            A list of 42 things gives you permission to dream bigger — and the structure to actually do it.
          </p>
        </div>

        <h2 className="text-3xl font-bold mb-8">What We're Building</h2>

        <p className="text-xl text-gray-600 mb-6">
          This started as a personal mission, but it's grown into something bigger.
          42 Things To Do is a community, a toolkit, a nudge, and a support network.
          It's for people who want to squeeze more out of life — whether that's adventure, creativity, connection, or self-discovery.
        </p>

        <p className="text-xl text-gray-600 mb-12">
          We're here to help you build your list, find people who share your goals, and connect you with the tools and encouragement you need to make it happen.
        </p>

        <p className="text-xl text-gray-600 mb-8">
          This isn't about showing off. It's about showing up — for yourself and others.
        </p>

        <div className="bg-gray-50 p-8 rounded-xl text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to write your story?</h2>
          <p className="text-xl text-gray-600">
            Start your list. Find your people. Make things happen.
          </p>
        </div>
      </div>
    </div>
  );
}