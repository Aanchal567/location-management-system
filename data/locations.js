// data/locations.js
const locationsData = {
    // India
    india: {
        name: "India",
        states: {
            punjab: {
                name: "Punjab",
                cities: {
                    jalandhar: { name: "Jalandhar", lat: 31.3260, lng: 75.5762 },
                    amritsar: { name: "Amritsar", lat: 31.6340, lng: 74.8723 },
                    ludhiana: { name: "Ludhiana", lat: 30.9010, lng: 75.8573 },
                    patiala: { name: "Patiala", lat: 30.3398, lng: 76.3869 },
                    bathinda: { name: "Bathinda", lat: 30.2109, lng: 74.9458 },
                    mohali: { name: "Mohali", lat: 30.7046, lng: 76.7179 },
                    pathankot: { name: "Pathankot", lat: 32.2683, lng: 75.6496 }
                }
            },
            delhi: {
                name: "Delhi",
                cities: {
                    delhi: { name: "Delhi", lat: 28.6139, lng: 77.2090 },
                    ncr: { name: "NCR", lat: 28.6139, lng: 77.2090 }
                }
            },
            maharashtra: {
                name: "Maharashtra",
                cities: {
                    mumbai: { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
                    pune: { name: "Pune", lat: 18.5204, lng: 73.8567 },
                    nagpur: { name: "Nagpur", lat: 21.1458, lng: 79.0882 },
                    nashik: { name: "Nashik", lat: 19.9975, lng: 73.7898 }
                }
            },
            rajasthan: {
                name: "Rajasthan",
                cities: {
                    jaipur: { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
                    jodhpur: { name: "Jodhpur", lat: 26.2389, lng: 73.0243 },
                    udaipur: { name: "Udaipur", lat: 24.5854, lng: 73.7125 },
                    ajmer: { name: "Ajmer", lat: 26.4499, lng: 74.6399 },
                    kota: { name: "Kota", lat: 25.2138, lng: 75.8648 }
                }
            },
            karnataka: {
                name: "Karnataka",
                cities: {
                    bangalore: { name: "Bangalore", lat: 12.9716, lng: 77.5946 },
                    mysore: { name: "Mysore", lat: 12.2958, lng: 76.6394 }
                }
            },
            gujarat: {
                name: "Gujarat",
                cities: {
                    ahmedabad: { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
                    surat: { name: "Surat", lat: 21.1702, lng: 72.8311 },
                    vadodara: { name: "Vadodara", lat: 22.3072, lng: 73.1812 }
                }
            },
            uttar_pradesh: {
                name: "Uttar Pradesh",
                cities: {
                    lucknow: { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
                    kanpur: { name: "Kanpur", lat: 26.4499, lng: 80.3319 },
                    agra: { name: "Agra", lat: 27.1767, lng: 78.0081 },
                    varanasi: { name: "Varanasi", lat: 25.3176, lng: 82.9739 },
                    meerut: { name: "Meerut", lat: 28.9845, lng: 77.7064 }
                }
            },
            bihar: {
                name: "Bihar",
                cities: {
                    patna: { name: "Patna", lat: 25.5941, lng: 85.1376 },
                    gaya: { name: "Gaya", lat: 24.7955, lng: 84.9994 },
                    bhagalpur: { name: "Bhagalpur", lat: 25.2425, lng: 86.9842 },
                    muzaffarpur: { name: "Muzaffarpur", lat: 26.1209, lng: 85.3645 },
                    darbhanga: { name: "Darbhanga", lat: 26.1542, lng: 85.8918 }
                }
            },
            west_bengal: {
                name: "West Bengal",
                cities: {
                    kolkata: { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
                    howrah: { name: "Howrah", lat: 22.5958, lng: 88.2636 }
                }
            },
            telangana: {
                name: "Telangana",
                cities: {
                    hyderabad: { name: "Hyderabad", lat: 17.3850, lng: 78.4867 }
                }
            },
            tamil_nadu: {
                name: "Tamil Nadu",
                cities: {
                    chennai: { name: "Chennai", lat: 13.0827, lng: 80.2707 },
                    coimbatore: { name: "Coimbatore", lat: 11.0168, lng: 76.9558 }
                }
            },
            madhya_pradesh: {
                name: "Madhya Pradesh",
                cities: {
                    bhopal: { name: "Bhopal", lat: 23.2599, lng: 77.4126 },
                    indore: { name: "Indore", lat: 22.7196, lng: 75.8577 }
                }
            },
            haryana: {
                name: "Haryana",
                cities: {
                    chandigarh: { name: "Chandigarh", lat: 30.7333, lng: 76.7794 },
                    gurugram: { name: "Gurugram", lat: 28.4595, lng: 77.0266 }
                }
            },
            himachal_pradesh: {
                name: "Himachal Pradesh",
                cities: {
                    shimla: { name: "Shimla", lat: 31.1048, lng: 77.1734 },
                    manali: { name: "Manali", lat: 32.2396, lng: 77.1887 }
                }
            },
            uttarakhand: {
                name: "Uttarakhand",
                cities: {
                    dehradun: { name: "Dehradun", lat: 30.3165, lng: 78.0322 },
                    haridwar: { name: "Haridwar", lat: 29.9457, lng: 78.1642 }
                }
            }
        }
    },
    // USA
    usa: {
        name: "USA",
        states: {
            california: {
                name: "California",
                cities: {
                    los_angeles: { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
                    san_francisco: { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
                    san_diego: { name: "San Diego", lat: 32.7157, lng: -117.1611 }
                }
            },
            new_york: {
                name: "New York",
                cities: {
                    new_york_city: { name: "New York City", lat: 40.7128, lng: -74.0060 }
                }
            },
            texas: {
                name: "Texas",
                cities: {
                    houston: { name: "Houston", lat: 29.7604, lng: -95.3698 },
                    dallas: { name: "Dallas", lat: 32.7767, lng: -96.7970 }
                }
            },
            florida: {
                name: "Florida",
                cities: {
                    miami: { name: "Miami", lat: 25.7617, lng: -80.1918 }
                }
            }
        }
    },
    // UK
    uk: {
        name: "United Kingdom",
        states: {
            england: {
                name: "England",
                cities: {
                    london: { name: "London", lat: 51.5074, lng: -0.1278 },
                    manchester: { name: "Manchester", lat: 53.4808, lng: -2.2426 }
                }
            },
            scotland: {
                name: "Scotland",
                cities: {
                    edinburgh: { name: "Edinburgh", lat: 55.9533, lng: -3.1883 }
                }
            }
        }
    },
    // Canada
    canada: {
        name: "Canada",
        states: {
            ontario: {
                name: "Ontario",
                cities: {
                    toronto: { name: "Toronto", lat: 43.6532, lng: -79.3832 }
                }
            },
            british_columbia: {
                name: "British Columbia",
                cities: {
                    vancouver: { name: "Vancouver", lat: 49.2827, lng: -123.1207 }
                }
            }
        }
    }
};

module.exports = locationsData;