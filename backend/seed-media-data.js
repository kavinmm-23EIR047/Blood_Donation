import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { Donor, Event, BloodRequest, HomepageContent } from './models.js';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // 1. Update featured donors with a mix of dynamic photos, empty photos, and broken URLs
  const donors = await Donor.find({ publicListing: true }).sort({ createdAt: 1 }).limit(10);
  console.log(`Found ${donors.length} donors`);

  if (donors.length >= 5) {
    // Donor 1: High quality dynamic portrait
    donors[0].featured = true;
    donors[0].photo = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
    await donors[0].save();

    // Donor 2: High quality dynamic portrait
    donors[1].featured = true;
    donors[1].photo = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80';
    await donors[1].save();

    // Donor 3: Skeleton test (no photo uploaded)
    donors[2].featured = true;
    donors[2].photo = '';
    await donors[2].save();

    // Donor 4: Skeleton test (no photo uploaded)
    donors[3].featured = true;
    donors[3].photo = '';
    await donors[3].save();

    // Donor 5: Broken URL test (onError fallback to skeleton)
    donors[4].featured = true;
    donors[4].photo = 'https://images.unsplash.com/broken-url-test-404.jpg';
    await donors[4].save();

    console.log('Updated 5 featured donors with dynamic photos, skeletons, and error fallbacks');
  }

  // 2. Seed upcoming and completed events
  await Event.deleteMany({});
  console.log('Cleared existing events');

  const today = new Date();
  const nextWeek = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const lastMonth = new Date(today.getTime() - 25 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

  await Event.create([
    {
      title: 'Modakkurichi Community Blood Donation Camp',
      date: nextWeek,
      location: 'Modakkurichi Block Primary Health Centre',
      description: 'Annual voluntary blood donation drive organized by Poongurichi Nanbargal Club. All donors receive health checkup & donor card.',
      image: 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80',
      status: 'Upcoming'
    },
    {
      title: 'Government Hospital Emergency Blood Camp',
      date: nextMonth,
      location: 'Erode GH Blood Bank Unit',
      description: 'Special weekend voluntary camp to support emergency trauma surgeries and thalassemia patients.',
      image: '', // Skeleton fallback test!
      status: 'Upcoming'
    },
    {
      title: 'Youth Voluntary Blood Drive - Modakkurichi',
      date: lastMonth,
      location: 'Government Higher Secondary School',
      description: '85 voluntary blood units collected to support local public hospitals.',
      status: 'Completed'
    },
    {
      title: 'World Blood Donor Day Community Camp',
      date: twoMonthsAgo,
      location: 'Poongurichi Union Ground',
      description: '120 voluntary donors felicitated with community badges and certificates.',
      status: 'Completed'
    }
  ]);
  console.log('Created 4 events (2 upcoming with image + skeleton, 2 completed)');

  // 3. Ensure HomepageContent reflects latest data
  const content = await HomepageContent.findOne({ key: 'public-homepage' });
  if (content) {
    content.stats = {
      ...content.stats,
      registeredDonors: await Donor.countDocuments(),
      availableDonors: await Donor.countDocuments({ available: true }),
      requestsServed: await BloodRequest.countDocuments({ status: 'Fulfilled' }),
      eventsOrganized: await Event.countDocuments({ status: 'Completed' }),
      bloodGroupsCovered: 8,
    };
    await content.save();
    console.log('Updated HomepageContent stats:', content.stats);
  }

  await mongoose.disconnect();
  console.log('Seeding finished successfully');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
