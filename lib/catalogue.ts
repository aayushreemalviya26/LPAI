export type LocalListing = {name:string; description:string; price:string; detail:string; photo:number};
export const localListings: Record<string, LocalListing[]> = {
  Food: [
    {name:'Rupaidiha Rasoi',description:'Fresh vegetarian thali',price:'₹150 / thali',detail:'Dal, seasonal sabzi, rice, roti and salad.',photo:0},
    {name:'Border Chai & Snacks',description:'Chai and hot snacks',price:'₹60 / combo',detail:'Two samosas with a freshly brewed cup of chai.',photo:1},
    {name:'Terai Momo Kitchen',description:'Vegetable momos',price:'₹100 / plate',detail:'Steamed vegetable momos served with spicy chutney.',photo:2}
  ],
  Stay: [
    {name:'Terai Comfort Stay',description:'Standard double room',price:'₹1,200 / night',detail:'A double bed, attached bathroom and a restful space for two.',photo:3},
    {name:'Rupaidiha Traveller Inn',description:'Budget twin room',price:'₹900 / night',detail:'Two single beds and a simple room for travelling companions.',photo:4},
    {name:'Gateway Family Lodge',description:'Family room',price:'₹1,800 / night',detail:'A double bed and single bed with space for a family of three.',photo:5}
  ],
  'Local Products': [
    {name:'Terai Basket House',description:'Handwoven cane basket',price:'₹250 / piece',detail:'A natural woven basket for everyday storage and gifting.',photo:6},
    {name:'Rupaidiha Textile Corner',description:'Woven cotton stole',price:'₹200 / piece',detail:'Soft cotton stoles in colourful woven patterns.',photo:7},
    {name:'Local Spice Pantry',description:'Everyday spice selection',price:'₹180 / pack',detail:'Turmeric, coriander and chilli powders for the home kitchen.',photo:8}
  ]
};

export const catalogueId = (photo:number) => "00000000-0000-4000-8000-000000000" + String(101+photo);
export const cataloguePrices = [150,60,100,1200,900,1800,250,200,180];
